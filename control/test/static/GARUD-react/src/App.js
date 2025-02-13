import { useState, useEffect, createRef, useImperativeHandle, useRef, forwardRef } from "react";
import React from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { OdinApp, useAdapterEndpoint, DropdownSelector, TitleCard, WithEndpoint,} from 'odin-react';
import 'odin-react/dist/index.css';
import './styles.css';
import Container from 'react-bootstrap/Container';
import InputGroup from 'react-bootstrap/InputGroup';
import Dropdown from 'react-bootstrap/Dropdown';
import Button from 'react-bootstrap/Button';
import Switch from "react-switch";
import Plot from 'react-plotly.js';
import PixelGrid from "./PixelGrid";

//import fs from "fs";

//Dictionary of the default binary values for each DAC
const DACDefaults = {
  "I_PIXEL_COLUMN_BIAS":"010110",
  "I_PGA_GAIN_BIAS2":"101101",
  "I_PGA_GAIN_BIAS":"001001",
  "I_PAG_OFF":"001011",
  "I_ADC_DRIVER_BIAS":"001001",
  "V_ADC_CASC_UP_BIAS":"010011",
  "V_ADC_CASC_DOWN_BIAS":"101011",
  "I_DAC_EXT_REF":"001001",
  "I_ADC_BIAS_1":"010001",
  "I_ADC_BIAS_2":"010001",
  "I_ADC_BIAS_3":"010001",
  "I_ADC_PLL_BIAS":"010010",
  "I_UFRC_PLL_BIAS":"010010",
  "I_UFRC_CML_P_BIAS":"011100",
  "I_UFRC_CML_N_BIAS":"011000",
}

/* A list of dictionaries - each dictionary will have the following structure 
{
"key": - stores the key to this DAC in the parameter tree
"path": - stores the path to the dac section of the parameter tree
"default" - stores the default value of this dac
"inputRef" - stores a reference to the DAC functional component
}
*/
var DACRefs = [];

var toggleRefs = [];
var saveInputRef = createRef();
var configs = JSON.parse(localStorage.getItem("configs"));
if (configs == null || configs == undefined){
  configs = {};
}

var SRConfigs = [];
var readoutConfigs = [];

const EndpointButton = WithEndpoint(Button);

//List of which toggles are inputs
const debugInputList = [
  "zinq_adc_sr_clk_debug_0",
  "zinq_adc_sr_load_debug_0",
  "zinq_adc_sr_clk_debug_1",
  "zinq_adc_sr_load_debug_1",
  "zinq_adc_sr_clk_debug_2",
  "zinq_adc_sr_load_debug_2",
  "zinq_adc_sr_clk_debug_3",
  "zinq_adc_sr_load_debug_3",
]


//Ashley's code for a toggleswitch (see odin-react repository on github), slightly edited,
//so that the label floats to the left and the toggle floats to the right as opposed to both floating to the left
const ToggleSwitch = forwardRef((props, ref) => {

  const {checked, value, id, label, onClick, disabled} = props;
  const [ischecked, setIsChecked] = useState(checked);

  useEffect(() => {
    setIsChecked(!!checked);
  }, [checked])

  const toggle = (check, event) => {
    setIsChecked(check);
    event.target.value = check;
    onClick(event)
  }
  return <InputGroup.Text>
  <p id="label" style={{fontSize:"1.00vw"}}>
    {label}
  </p>
  <div style={{width:"55px"}}>
    <div style={{width:"100000px", height:"1px"}}></div>
    <div style={{float:"right"}}>
    <Switch
      ref={ref}
      checked={ischecked} onChange={toggle} disabled={disabled}
      onColor="#86d3ff" onHandleColor="#2693e6" handleDiameter={25}
      boxShadow="0px 1px 5px rgba(0, 0, 0, 0.6)" activeBoxShadow="0px 0px 1px 10px rgba(0, 0, 0, 0.2)"
      height={20} width={48}
    aria-labelledby={id} />
    </div>
  </div>
  </InputGroup.Text>
})


/**
 * get the section of the parameter tree at the end of "path"
 * @param  {JSON} paramTree the parameter tree
 * @param  {[String]} path the path to the section of the parameter tree that we want
 * @return {JSON}     the section of the parameter tree at the end of 'path'
 */
function getNested(paramTree, path){
  try{
    var current = paramTree;
    for (let pathSection of path){
      var current = current[pathSection];
    }
    return current;
  }
  catch{
    return {};
  }
}

/**
 * The Toggle function is a react functional component, consisting of a div containing a single toggleswitch, 
 * which updates a parameter tree when toggled by sending a PUT request to an endpoint and merging the response data.
 * @param props - Props are the properties passed to a React component. In this code snippet, the
 * `Toggle` component receives props such as `endpoint`, `accessor`, and `path`. These props are used
 * to update the parameter tree when the toggle switch is clicked.
 * @returns The `Toggle` component is being returned, which contains a `ToggleSwitch` component with
 * specific props such as label, onClick function, and checked status based on the data from the
 * endpoint.
 */
const Toggle = React.forwardRef((props, ref) => {
  //update the parameter tree when toggled
  function onToggled(event){
    props.endpoint.put({[props.accessor]:Number(event.target.value)}, props.path.join("/"))
    .then((response) => {
      props.endpoint.mergeData(response, props.path.join("/"));
    })
    .catch((err) => {
      console.error(err);
    });
  }
  return  <div style={{width:"24%", marginBottom:"1%"}}>
    <ToggleSwitch
      disabled={props.disabled}
      ref={ref}
      label={format_string(String(props.accessor))}
      onClick={onToggled}
      checked={props.endpoint.data ? Boolean(getNested(props.endpoint.data, props.path)[props.accessor]) : false}
    />
  </div>
})



/**
 * iterates through all the key-value pairs at pathToIOPins in the parameter tree 
 * and creates a toggle for each of them, returning a list of the toggles so they can be displayed
 * @param {adapterEndpoint} periodicEndpoint - the endpoint to use to update the parameter tree with the toggles' values
 * @param {boolean} isOutput - whether to generate the html for the output toggles or the input toggles
 * @returns {[JSX]} - a list of toggle components (see toggle function above)
 */
function GetToggles(periodicEndpoint, isOutput){
  const pathToIOPins = ["application", "gpio_direct"];
  var toggles = [];
  for (let key of Object.keys(getNested(periodicEndpoint.data, pathToIOPins))){
    if (!debugInputList.includes(key) && isOutput){
      toggleRefs.push(
        {
          "name":key,
        })
      toggles.push(
        <Toggle endpoint={periodicEndpoint} path={pathToIOPins} accessor={key}/>
      );
    }
    if (debugInputList.includes(key) && !isOutput){
      toggles.push(
        <Toggle endpoint={periodicEndpoint} path={pathToIOPins} accessor={key}/>
      );
    }
  }
  return toggles;
}

//a functional component to display a input box, to edit the value of the dac, a toggle, to switch whether 
//you are inputting binary or denary numbers, and a bit of text showing the default value for this dac
const DAC = React.forwardRef((props,ref) => 
{
  //give the ref passed in two child refs, toggleRef and inputRef (accessed externally 
  //as input and toggle) so that you can access both the toggle and the input externally
  const toggleRef = useRef();
  const inputRef = useRef();
  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current.focus();
    },
    get input() {
        return inputRef.current;
    },
    get toggle() {
        return toggleRef.current;
    }
  }));
  //A toggle to determine whether we are showing and inputing binary values or denary values
  const [numberType, setNumberType] = useState("Denary");
  const input = <input className="textInput" type="number" defaultValue={getValue()} ref={inputRef} onKeyDown={preventNonNumericCharacters} onChange={onChangeInput}></input> 
  /*const [repeatTrigger, setRepeatTrigger] = useState(0);

  useEffect(() => {
    //if the textbox for this DAC is not in focus (currently selected)
    if (document.activeElement !== inputRef.current){
      reload();
    }
    //Repeat this process in 1000 milliseconds (repeatTrigger variable is soley used to cause a dependency update in 1000 seconds, causing a rerun of this function.)
    setTimeout(() => {
      setRepeatTrigger(repeatTrigger + 1)
    }, 1000);
  }, [repeatTrigger])
  
  //update the currently shown value with the actual value from the parameter tree
  function reload(){
    if (inputRef != null)
      if (inputRef.current.value != getValue() && inputRef.current.value != parseInt(String(getValue()),2)){
        if (numberType == "Binary"){
          inputRef.current.value = Number(getValue()).toString(2);
        }
        else if (numberType == "Denary"){
          inputRef.current.value = getValue();
        }
      }
  }*/

//Switch the input between accepting and showing binary numbers and accepting and showing denary numbers
  function toggleNumType(){
    if (numberType == "Binary"){
      setNumberType("Denary");
      //convert the currently shown binary value to denary
      inputRef.current.value = parseInt(String(inputRef.current.value), 2);
      
    }
    else if (numberType == "Denary"){
      setNumberType("Binary");
      //convert the currently shown denary value to binary
      inputRef.current.value = Number(inputRef.current.value).toString(2);
    }
  }
  
  //prevents most keys from having an effect, except: the keys 0 and 1, the keys 2-9 when we are accepting denary inputs, 
  //the backspace key, the delete key and the left and right arrow keys.
  function preventNonNumericCharacters(event) {
    var whitelist = [8, 12, 33, 34, 35, 36, 37, 39, 46,]
    var e = event || window.event;  
    var key = e.keyCode || e. which;
    console.log(key)
    if (numberType == "Binary"){
      if ((key < 48 || key > 49) && (key != 96 && key != 97) && !whitelist.includes(key)) {
        if (e.preventDefault){
          e.preventDefault();
        } 
        e.returnValue = false;
      } 
    } 
    else if (numberType == "Denary"){                             
      if ((key < 48 || key > 57)&&(key < 96 || key > 105)&&(key != 8)&&(key != 46)&&(key != 37)&&(key != 39)) {
        if (e.preventDefault){
          e.preventDefault();
        } 
        e.returnValue = false; 
      }
    } 
  }

  function getValue(){
    var value = parseInt(Number(props.default), 2);
    if (getNested(props.endpoint.data, props.pathToDACs)[props.accessor] != null)
    {
      value = getNested(props.endpoint.data, props.pathToDACs)[props.accessor];
    }
    else{
      props.endpoint.put({[props.accessor]:String(parseInt(Number(props.default), 2))}, props.pathToDACs.join("/"))
        .then(response => {
          props.endpoint.mergeData(response, props.pathToDACs.join("/"));
        })
        .catch((err) => {
          console.error(err);
        });
    }
    return value;
  }


  function onChangeInput(event){
    //Restrict the binary input to 6 digits
    if (numberType == "Binary" && event.target.value.length > 6){
      event.target.value = event.target.value.slice(0, 6);
    }
    //Restrict the denary inputs to 2 digits long and a maximum of 63 (the maximum binary value you can have in 6 digits)
    else if (numberType == "Denary" && event.target.value.length > 2){
      event.target.value = event.target.value.slice(0, 2);
    }
    if (numberType == "Denary" && Number(event.target.value) > 63){
      event.target.value = "63";
    }
    else if (event.target.value != ""){
      if (numberType == "Binary"){
        //send the inputted value to the adapter, converting from binary to denary, and load the response into the parameter tree
        props.endpoint.put({[props.accessor]:parseInt(String(event.target.value),2)}, props.pathToDACs.join("/"))
        .then((response) => {
          props.endpoint.mergeData(response, props.pathToDACs.join("/"));
        })
        .catch((err) => {
          console.error(err);
        });
      }
      else if (numberType == "Denary"){
        //send the inputted value to the adapter, and load the response into the parameter tree
        props.endpoint.put({[props.accessor]:Number(event.target.value)}, props.pathToDACs.join("/"))
        .then(response => {
          props.endpoint.mergeData(response, props.pathToDACs.join("/"));
        })
        .catch((err) => {
          console.error(err);
        });
      }
    }
  }
  

  return (
    <> 
      <div className="box" 
      style={{padding:"5px",}}>
      <p style={{marginBottom:"0px", float:"left"}}>{format_string(props.accessor) + ":"}</p>&nbsp;
      {input}&nbsp;
      </div>
      <InputGroup.Text>
        <label style={{marginRight: "4px"}}>
          Binary:
        </label>
        <div style={{height:"1px", width:"5000px"}}></div>
        <div style={{float:"right"}}>
          <Switch 
            ref={toggleRef}
            checked={numberType=="Binary"} onChange={toggleNumType}
            onColor="#86d3ff" onHandleColor="#2693e6" handleDiameter={25}
            boxShadow="0px 1px 5px rgba(0, 0, 0, 0.6)" activeBoxShadow="0px 0px 1px 10px rgba(0, 0, 0, 0.2)"
            height={20} width={48}
          />
        </div>
    </InputGroup.Text>
    <InputGroup.Text>
    <p style={{marginBottom:"0px"}}>Default: {numberType=="Binary" ? props.default : parseInt(Number(props.default), 2)}</p>
    </InputGroup.Text>
    </>
  );
})


/**
 * iterates through all the key-value pairs at pathToDACs in the parameter tree 
 * and generate an instance of the DAC functional component for each one
 * @param {adapterEndpoint} periodicEndpoint - the endpoint to update the DAC values
 * @returns {[JSX]} - a list of DAC components (see DAC function above)
 */
function GetDACs(periodicEndpoint){
  var DACs = [];
  const pathToDACs = ["application", "dacs", "FIELDS"];

  for (let key of Object.keys(getNested(periodicEndpoint.data, pathToDACs))){
    //store all the data we need to access this component later so that we can reset it to default if necessary.
    DACRefs.push(
      {
        "key":key,
        "path":pathToDACs,
        "default":DACDefaults[key.toUpperCase()],
        "ref":createRef(),
      })
      
    DACs.push(<>
      <div style={{display:"inline-block", minWidth:"300px", width:"32%", marginRight:"0.5%", marginLeft:"0.5%", borderWidth:"1px", borderColor:"#dee2e6", borderRadius:"5px", backgroundColor:"#f8f9fa", marginBottom:"5px", borderStyle:"solid", padding:"5px"}}>
      <DAC ref={DACRefs[DACRefs.length-1].ref} endpoint={periodicEndpoint} accessor={key} pathToDACs={pathToDACs} default={DACDefaults[key.toUpperCase()]}/>
      </div>
      </>);
  }
  return DACs;
}

//a functional component to display a input box, that only accepts 0 or 1 to edit the value of the register
const Config = React.forwardRef((props, ref) => {
  //give the ref passed in two child refs, toggleRef and inputRef (accessed externally 
  //as input and toggle) so that you can access both the toggle and the input externally
  const inputRef = useRef();
  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current.focus();
    },
    get input() {
        return inputRef.current;
    },
    get toggle() {
        return toggleRef.current;
    }
  }));
  const input = <input style={{float:"right"}} className="textInput" type="number" defaultValue={getValue()} ref={inputRef} onKeyDown={preventNonNumericCharacters} onChange={onChangeInput}></input> 
  /*const [repeatTrigger, setRepeatTrigger] = useState(0);

  useEffect(() => {
    //if the textbox for this config is not in focus (currently selected)
    if (document.activeElement !== inputRef.current){
      reload();
    }
    //Repeat this process in 1000 milliseconds (repeatTrigger variable is soley used to cause a dependency update in 1000 seconds, causing a rerun of this function.)
    setTimeout(() => {
      setRepeatTrigger(repeatTrigger + 1)
    }, 1000);
  }, [repeatTrigger])

  //update the currently shown value with the actual value from the parameter tree
  function reload(){
    if (inputRef != null)
      if (inputRef.current.value != getValue()){
        if (getValue() != null){
          inputRef.current.value = getValue()?.toString();
        }
      }
  }*/

  
  //prevents most keys from having an effect, except: the keys 0 and 1, the backspace key, the delete key and the left and right arrow keys.
  function preventNonNumericCharacters(event) {
    var whitelist = [8, 12, 33, 34, 35, 36, 37,39, 46,]
    var e = event || window.event;  
    var key = e.keyCode || e. which;
    if ((key < 48 || key > 49) && (key != 96 && key != 97) && !whitelist.includes(key)) {
      if (e.preventDefault){
        e.preventDefault();
      } 
      e.returnValue = false;
    } 
  }

  function getValue(){
    return getNested(props.endpoint.data, props.pathToConfigs)[props.accessor];
  }

  function onChangeInput(event){
    //if the value in the text box is longer than one character, cut it back down to one character.
    event.target.value = event.target.value.slice(0, 1);
    if (event.target.value != ""){
      //send the inputted value to the adapter, and load the response into the parameter tree
      props.endpoint.put({[props.accessor]:Number(event.target.value)}, props.pathToConfigs.join("/"))
      .then(response => {
        props.endpoint.mergeData(response, props.pathToConfigs.join("/"));
      })
      .catch((err) => {
        console.error(err);
      });
    }
  }
  

  return (
    <> 
      <div className="box" 
        style={{padding:"5px",}}>
        <div style={{width:"100%"}}> 
          <p style={{marginBottom:"0px", float:"left"}}>{format_string(props.accessor) + ":"}</p>&nbsp;
          {input}&nbsp;
        </div>
      </div>
    </>
  );
})


/**
 * iterates through all the key-value pairs at pathToConfigs in the parameter tree 
 * and generate an instance of the Config functional component for each one
 * @param {adapterEndpoint} periodicEndpoint - the endpoint to update the config values
 * @returns {[JSX]} - a list of Config components (see Config function above)
 */
function GetConfigs(periodicEndpoint){
  var configs = [];
  const pathToConfigs = ["application", "configbits", "FIELDS"];

  for (let key of Object.keys(getNested(periodicEndpoint.data, pathToConfigs))){
    //store all the data we need to access this component later
    SRConfigs.push({
      "key":key,
      "ref":createRef()
    });
    configs.push(<>
      <div style={{display:"inline-block", minWidth:"300px", width:"32%", marginRight:"0.5%", marginLeft:"0.5%", borderWidth:"1px", borderColor:"#dee2e6", borderRadius:"5px", backgroundColor:"#f8f9fa", marginBottom:"5px", borderStyle:"solid", padding:"5px"}}>
        <Config ref={SRConfigs[SRConfigs.length-1].ref} endpoint={periodicEndpoint} accessor={key} pathToConfigs={pathToConfigs} />
      </div>
      </>);
  }
  return configs;
}

//a functional component to display 3 input boxes, that each only accepts 0 or 1 to edit the value of the registers
const ReadoutConfig = React.forwardRef((props, ref) => {
  //give the ref passed in two child refs, toggleRef and inputRef (accessed externally 
  //as input and toggle) so that you can access both the toggle and the input externally
  const inputRef1 = useRef();
  const inputRef2 = useRef();
  const inputRef3 = useRef();
  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current.focus();
    },
    get input1() {
        return inputRef1.current;
    },
    get input2() {
      return inputRef2.current;
    },
    get input3() {
      return inputRef3.current;
    },
  }));
  const input1 = <input style={{float:"right"}} className="textInput" type="number" defaultValue={getValue("AB_GATE_EN")} ref={inputRef1} onKeyDown={preventNonNumericCharacters} onChange={(event) => onChangeInput(event, "AB_GATE_EN")}></input> 
  const input2 = <input style={{float:"right"}} className="textInput" type="number" defaultValue={getValue("2_LEVEL_READOUT")} ref={inputRef2} onKeyDown={preventNonNumericCharacters} onChange={(event) => onChangeInput(event, "2_LEVEL_READOUT")}></input> 
  const input3 = <input style={{float:"right"}} className="textInput" type="number" defaultValue={getValue("BLOCK_ENABLE")} ref={inputRef3} onKeyDown={preventNonNumericCharacters} onChange={(event) => onChangeInput(event, "BLOCK_ENABLE")}></input> 
  /*const [repeatTrigger, setRepeatTrigger] = useState(0);

  useEffect(() => {
    //if the textbox for this config is not in focus (currently selected)
    if (document.activeElement !== inputRef1.current){
      reload(inputRef1, "AB_GATE_EN");
    }
    if (document.activeElement !== inputRef2.current){
      reload(inputRef2, "2_LEVEL_READOUT");
    }
    if (document.activeElement !== inputRef3.current){
      reload(inputRef3, "BLOCK_ENABLE");
    }
    //Repeat this process in 1000 milliseconds (repeatTrigger variable is solely used to cause a dependency update in 1000 seconds, causing a rerun of this function.)
    setTimeout(() => {
      setRepeatTrigger(repeatTrigger + 1)
    }, 1000);
  }, [repeatTrigger])*/

  
  //prevents most keys from having an effect, except: the keys 0 and 1, the backspace key, the delete key and the left and right arrow keys.
  function preventNonNumericCharacters(event) {
    var whitelist = [8, 12, 33, 34, 35, 36, 37, 39, 46,]
    var e = event || window.event;  
    var key = e.keyCode || e. which;
    if ((key < 48 || key > 49) && (key != 96 && key != 97) && !whitelist.includes(key)) {
      if (e.preventDefault){
        e.preventDefault();
      } 
      e.returnValue = false;
    } 
  }

  function getValue(accessor){
    return getNested(props.endpoint.data, props.pathToConfigs)[props.accessor][accessor];
  }

  //update the currently shown value with the actual value from the parameter tree
  function reload(inputRef, accessor){
    if (inputRef != null)
      if (inputRef.current.value != getValue(accessor)){
        inputRef.current.value = getValue(accessor)?.toString();
      }
  }

  function onChangeInput(event, accessor){
    //if the input is more than one character long cut it back down to one character
    event.target.value = event.target.value.slice(0, 1);

    if (accessor == "2_LEVEL_READOUT" && event.target.value != ""){
      for (let config of readoutConfigs){
        if (config.ref.current != null){
          config.ref.current.input2.value = event.target.value;
          props.endpoint.put({[accessor]:Number(event.target.value)}, props.pathToConfigs.join("/") + "/" + config.key)
          .then(response => {
            props.endpoint.mergeData(response, props.pathToConfigs.join("/") + "/" + config.key);
          })
          .catch((err) => {
            console.error(err);
          });
        }
      }
    }
    else{
      if (event.target.value != ""){
        //send the inputted value to the adapter, and load the response into the parameter tree
        props.endpoint.put({[accessor]:Number(event.target.value)}, props.pathToConfigs.join("/") + "/" + props.accessor)
        .then(response => {
          props.endpoint.mergeData(response, props.pathToConfigs.join("/") + "/" + props.accessor);
        })
        .catch((err) => {
          console.error(err);
        });
      }
    }
  }
  

  return (
    <> 
      <div className="box" style={{padding:"5px",}}>
        <p style={{marginBottom:"0px", width:"100%"}}>{format_string(props.accessor) + ":"}</p>
        <div style={{width:"100%", height:"1px", backgroundColor:"black", marginTop:"2px", marginBottom:"6px"}}></div>
        <div style={{width:"100%"}}>
        <p style={{marginBottom:"0px", float:"left"}}>AB_GATE_EN:</p>&nbsp;{input1}
        </div>
        <div style={{width:"100%"}}>
        <p style={{marginBottom:"0px", float:"left"}}>2_LEVEL_READOUT:</p>&nbsp;{input2}
        </div>
        <div style={{width:"100%"}}>
        <p style={{marginBottom:"0px", float:"left"}}>BLOCK_ENABLE:</p>&nbsp;{input3}
        </div>
      </div>
    </>
  );
})

/**
 * iterates through all the key-value pairs at pathToConfigs in the parameter tree 
 * and generate an instance of the ReadoutConfig functional component for each one
 * @param {adapterEndpoint} periodicEndpoint - the endpoint to update the ReadoutConfig values
 * @returns {[JSX]} - a list of Config components (see ReadoutConfig function above)
 */
function GetReadoutConfig(periodicEndpoint){
  var configs = [];
  const pathToConfigs = ["application", "readoutconfig", "FIELDS"];

  for (let key of Object.keys(getNested(periodicEndpoint.data, pathToConfigs))){
    //store all the data we need to access this component later
    readoutConfigs.push({
      "key":key,
      "ref":createRef()
    });
    configs.push(<>
      <div style={{display:"inline-block", minWidth:"300px", width:"24%", marginRight:"0.5%", marginLeft:"0.5%", borderWidth:"1px", borderColor:"#dee2e6", borderRadius:"5px", backgroundColor:"#f8f9fa", marginBottom:"5px", borderStyle:"solid", padding:"5px"}}>
        <ReadoutConfig ref={readoutConfigs[readoutConfigs.length-1].ref} endpoint={periodicEndpoint} accessor={key} pathToConfigs={pathToConfigs} />
      </div>
      </>);
  }
  return configs;
}

/**
 * remove unnecessary brackets from beginning and end of json, unindent it by num_spaces, 
 * then add in the html to colour booleans (blue), strings (brown), numbers (green) and brackets (yellow)
 * @param {String} json_string - the json object passed in as a string
 * @param {Number} num_spaces - the number of spaces used for indenting
 * @returns {String} - the json string, formatted
 */
function format_json(json_string, num_spaces){
  var json_formatted = " ".repeat(num_spaces)+json_string.slice(1,-2).trim();
  var json_lines = json_formatted.split("\n");
  for (let i = 0; i < json_lines.length; i++){
    json_lines[i] = json_lines[i].replace(" ".repeat(num_spaces), "");
  }
  json_formatted = json_lines.join("\n");
   //colour bools
  json_formatted = json_formatted.replaceAll("true", "<span class='bool'>true</span>").replaceAll("false", "<span class='bool'>false</span>");
  //colour numbers
  json_formatted = json_formatted.replace(/:\s\d+\.?\d*/g, function(a) {return ": <span class='number'>" + a.replace(": ", "") + "</span>";});
  json_formatted = json_formatted.replace(/\[([^\[\]]*)\]/g, function(a) {return "<span class='number'>" + a.replaceAll(",", "</span>,<span class='number'>") + "</span>";});
  //colour strings
  json_formatted = json_formatted.replace(/"(?:[^"\\]|\\.)*"/g, function(a) {return "<span class='string'>" + a + "</span>";});
  //colour brackets
  json_formatted = json_formatted.replaceAll("{", "<span class='bracket'>{</span>").replaceAll("}", "<span class='bracket'>}</span>");
  json_formatted = json_formatted.replaceAll("[", "<span class='bracket'>[</span>").replaceAll("]", "<span class='bracket'>]</span>");
  json_formatted = json_formatted.replaceAll("null", "<span class='null'>null</span>")
  return json_formatted;
}

/**
 * return the input string with its first letter capitalized, and all underscores converted to spaces, 
 * and spaces added between capitalized words so as to display names more nicely
 * @param {String} str - the string to format
 * @returns {String} - the string, with first letter capitalized, underscores converted to spaces and spaces between capitalized words
 */
function format_string(str){
  return str.replaceAll("_", " ").replace(/(^\w|\s\w)/g, m => m.toUpperCase()).replace(/([A-Z]+)/g, ' $1').trim().replace("/ ", "/");
}

/**
 * iterate through each dac and reset its response to the default, before updating the adapter with the default value.
 * @param {adapterEndpoint} periodicEndpoint - the endpoint to use to update the DAC values
 */
function ResetDACs(periodicEndpoint){
  console.log(DACRefs)
  for (let dac of DACRefs){
    if (dac.ref.current != null){
      //if the toggle is checked, this DAC is in binary mode
      if (dac.ref.current.toggle.props.checked){
        dac.ref.current.input.value = dac.default;
        periodicEndpoint.put({[dac.key]:parseInt(String(dac.ref.current.input.value),2)}, dac.path.join("/"))
        .then((response) => {
          periodicEndpoint.mergeData(response, dac.path.join("/"));
        })
        .catch((err) => {
          console.error(err);
        });
      }
      //the toggle is not checked, this DAC should show the denary value
      else{
        dac.ref.current.input.value = parseInt(Number(dac.default), 2);
        periodicEndpoint.put({[dac.key]:dac.ref.current.input.value}, dac.path.join("/"))
        .then((response) => {
          periodicEndpoint.mergeData(response, dac.path.join("/"));
        })
        .catch((err) => {
          console.error(err);
        });
      }
    }
  }
}

//Save the current configuration of the toggles to localstorage, under the name currently in the input field (default config)
function saveConfig(endpoint){
  var path = ["application", "gpio_direct"]
  var configDict = {}
  for (let toggle of toggleRefs){
    configDict[toggle.name] = getNested(endpoint.data, path)[toggle.name];
  }

  configs[saveInputRef.current.value] = configDict;
  localStorage.setItem("configs", JSON.stringify(configs));
  alert("Save successful.")
}

//get the save and load boxes and their inputs displayed in the controls titlecard's title section
function GetSaveLoadBar([loadInput, setLoadInput], endpoint){
  return <div style={{float:"right"}}>
    <div style={{marginRight:"20px", display:"inline-block"}}>
      <TitleCard title="Save">
        <input onClick={() => saveConfig(endpoint)} style={{display:"inline-block",  height:"38px", width:"47%", color:"white", backgroundColor:"#0d6efd", borderColor:"#0d6efd", borderStyle:"solid", borderRadius:"5px"}} type="button" value="Save configuration as"/>&nbsp;
        <input className="textInput" ref={saveInputRef} style={{display:"inline-block",  height:"38px", width:"51%"}} type="text" defaultValue="config"/>
        
      </TitleCard>
    </div>
    <div style={{display:"inline-block"}}>
      <TitleCard title="Load">
        <DropdownSelector buttonText={loadInput || "None"} onSelect={(event)=>changeLoadInput(event, [loadInput, setLoadInput])}>
          {Object.keys(configs).map(
              (selection, index) =>
              (
                <Dropdown.Item eventKey={selection} key={index} active={selection == loadInput}>{selection}</Dropdown.Item>
              )
          )}
        </DropdownSelector> &nbsp;
        <input onClick={() => loadConfig([loadInput, setLoadInput], endpoint)} style={{display:"inline-block", height:"38px", color:"white", backgroundColor:"#0d6efd", borderStyle:"none",borderRadius:"5px"}} type="button" value="Load configuration"/>
      </TitleCard>
    </div>
  </div>
}

//Notify the user if no saved config is available to load. Otherwise, load the currently selected config
function loadConfig([loadInput, setLoadInput], endpoint){
  if (loadInput == "None"){
    alert("No save available.")
    return;
  }
  applyConfig(configs[loadInput], endpoint);
}

//loop through each of the toggles in the loaded config, and generate a dictionary that can be used to update the adapter, which will then itself update the toggles
function applyConfig(config, endpoint){
  const pathToIOPins = ["application", "gpio_direct"];
  var dict = {}
  for (let toggleRef of toggleRefs){
    dict[toggleRef.name] = Number(config[toggleRef.name]);
  }
  endpoint.put(dict, pathToIOPins.join("/"))
    .then((response) => {
      endpoint.mergeData(response, pathToIOPins.join("/"));
    })
    .catch((err) => {
      console.error(err);
    });
}

//set the loadInput state variable to the current value of the dropdown selector
function changeLoadInput(event, [loadInput, setLoadInput]){
  setLoadInput(event);
}

//Overwrite the values currently in the Config inputs (see config functional component) with the values in the parameter tree
function resetSRConfig(endpoint){
  var pathToSRConfigs = ["application", "configbits"]
  endpoint.put({["RESTORE"]:true}, pathToSRConfigs.join("/"))
  .then(response => {
    endpoint.mergeData(response, pathToSRConfigs.join("/"));
    var data = getNested(endpoint.data, pathToSRConfigs);
    for (let config of SRConfigs){
      if (config.ref.current != null){
        config.ref.current.input.value = data["FIELDS"][config.key];
      }
    }
  })
  .catch((err) => {
    console.error(err);
  })

}

//Overwrite the values currently in the DAC inputs (see DAC functional component) with the values in the parameter tree
function resetDACsToValues(endpoint){
  var pathToDACs = ["application", "dacs"]
  endpoint.put({["RESTORE"]:true}, pathToDACs.join("/"))
  .then(response => {
    endpoint.mergeData(response, pathToDACs.join("/"));
    var data = getNested(endpoint.data, pathToDACs);
    for (let config of DACRefs){
      if (config.ref.current != null){
        config.ref.current.input.value = data["FIELDS"][config.key];
      }
    }
  })
  .catch((err) => {
    console.error(err);
  })
}

//Overwrite the values currently in the ReadoutConfig inputs (see ReadoutConfig functional component) with the values in the parameter tree
function resetReadoutConfig(endpoint){
  var pathToConfig = ["application", "readoutconfig"]
  endpoint.put({["RESTORE"]:true}, pathToConfig.join("/"))
  .then(response => {
    endpoint.mergeData(response, pathToConfig.join("/"));
    var data = getNested(endpoint.data, pathToConfig);
    for (let config of readoutConfigs){
      if (config.ref.current != null){
        config.ref.current.input1.value = data["FIELDS"][config.key]["AB_GATE_EN"];
        config.ref.current.input2.value = data["FIELDS"][config.key]["2_LEVEL_READOUT"];
        config.ref.current.input3.value = data["FIELDS"][config.key]["BLOCK_ENABLE"];
      }
    }
  })
  .catch((err) => {
    console.error(err);
  })
}

//Generate the buttons for the title bar of the configuration registers - two buttons, one of which resets any changed values to their true values, and one which applies any changed values.
function GetButtons(periodicEndpoint, func_to_run, type){
  if (Object.keys(periodicEndpoint.data).length > 0 && !periodicEndpoint.data.application[type].SYNC_ON_WRITE){
    return <>
      {Object.keys(periodicEndpoint.data).length > 0 && !periodicEndpoint.data.application[type].SYNC ? 
        <input onClick={() => func_to_run(periodicEndpoint)} style={{float:"right"}} className="nice-button" type="button" value="Reset to true values"/>  : 
        <input style={{float:"right"}} className="disabled-button" type="button" disabled value="Reset to true values"/>}
      {Object.keys(periodicEndpoint.data).length > 0 && !periodicEndpoint.data.application[type].SYNC ? 
        <EndpointButton style={{float:"right", marginRight:"5px"}} endpoint={periodicEndpoint} event_type="click" fullpath={"application/"+type+"/SYNC"} value={true}>Apply</EndpointButton> : 
        <EndpointButton style={{float:"right", marginRight:"5px", backgroundColor:"grey", borderColor:"grey"}} fullpath={"application/"+type+"/SYNC"} endpoint={periodicEndpoint} disabled>Apply</EndpointButton>}
    </>
  }
  else{
    return <></>
  }
}

function get_power_supply(periodicEndpoint, supply){
  var power_supply = []
  //when the channel is toggled, send the value to the adapter to turn it on or off
  function onToggled(event, path, periodicEndpoint){
    periodicEndpoint.put({["status"]:event.target.value}, path)
    .then((response) => {
      periodicEndpoint.mergeData(response, path);
    })
    .catch((err) => {
      console.error(err);
    });
  }

  //iterate through each channel and create a box for it with a toggle to turn it on and off
  for (let channel of Object.keys(periodicEndpoint.data.ttipsu["devices"][supply].channels)){
    power_supply.push(
      <>
        <div style={{width:"180px", float:"left",  height:"47px"}}>
          <ToggleSwitch
            label={format_string("Channel " + String(channel))}
            onClick={(event) => onToggled(event, "ttipsu/devices/" + supply + "/channels/" + channel, periodicEndpoint)}
            checked={periodicEndpoint.data.ttipsu["devices"][supply].channels[channel].status}
          />
        </div>
        <div className="powerSupply">
          <InputGroup.Text style={{paddingLeft:"0px", paddingRight:"0px"}}>
            <p style={{marginBottom:"0px", height:"33px", textAlign:"center", width:"100%"}}>{periodicEndpoint.data.ttipsu["devices"][supply].channels[channel].voltage.output + " V"}</p>
          </InputGroup.Text>
        </div>
        <div className="powerSupply">
          <InputGroup.Text style={{paddingLeft:"0px", paddingRight:"0px"}}>
            <p style={{marginBottom:"0px", height:"33px", textAlign:"center", width:"100%"}}>{periodicEndpoint.data.ttipsu["devices"][supply].channels[channel].current.output + " A"}</p>
          </InputGroup.Text>
        </div>
        <div className="powerSupply">
          <InputGroup.Text style={{paddingLeft:"0px", paddingRight:"0px"}}>
            <p style={{marginBottom:"0px", height:"33px", textAlign:"center", width:"100%"}}>{Math.abs(Math.round(periodicEndpoint.data.ttipsu["devices"][supply].channels[channel].voltage.output*periodicEndpoint.data.ttipsu["devices"][supply].channels[channel].current.output * 10000)/10000) + " W"}</p>
          </InputGroup.Text>
        </div>
      </>
    )
  }
  return power_supply
}

function get_power_supplies(periodicEndpoint){
  var power_supplies = []  

  //send a command to the adapter to enable the power supply
  function onToggled(event, path, periodicEndpoint){
    periodicEndpoint.put({["remote_enable"]:event.target.value}, path)
    .then((response) => {
      periodicEndpoint.mergeData(response, path);
    })
    .catch((err) => {
      console.error(err);
    });
  }

  //iterate through each power supply, and create a card with a toggle and the channels
  for (let supply of Object.keys(periodicEndpoint.data.ttipsu["devices"])){
    power_supplies.push(
      <div style={{width:"48%", display:"inline-block", marginLeft:"1%", marginRight:"1%"}}>
      <TitleCard title={<>
        <p style={{float:"left"}}>
          {supply + ". " + periodicEndpoint.data.ttipsu["devices"][supply].id + " hosted on " + periodicEndpoint.data.ttipsu["devices"][supply].host}
        </p>
        <div style={{width:"200px", float:"right"}}>
          <ToggleSwitch
              label="Remote Access"
              onClick={(event) => onToggled(event, "ttipsu/devices/" + supply + "/", periodicEndpoint)}
              checked={periodicEndpoint.data.ttipsu["devices"][supply].remote_enable}
            />
        </div>
        </>}>
        {get_power_supply(periodicEndpoint, supply)}
      </TitleCard>
      </div>
    )
  }
  return power_supplies
}

// calculate the power of each power supply, remove any negatives and sum them together, before rounding the power to four decimal places
function get_total_power(periodicEndpoint){
  var total_power = 0
  for (let supply of Object.keys(periodicEndpoint.data.ttipsu["devices"])){
    for (let channel of Object.keys(periodicEndpoint.data.ttipsu["devices"][supply].channels)){
      total_power += Math.abs(periodicEndpoint.data.ttipsu["devices"][supply].channels[channel].voltage.output * periodicEndpoint.data.ttipsu["devices"][supply].channels[channel].current.output)
    }
  }
  return Math.round(total_power * 10000)/10000
}

// A function to evaluate if two arrays of data are the same, by converting them to strings and comparing them
function isEqual(oldProps, newProps){
  return Array.from(oldProps.z_data).flat().join(",") === Array.from(newProps.z_data).flat().join(",")
}

// a plotly component, to create a heatmap in black and white. The use of memo makes it only rerender when the isEqual function is false
const Heatmap = React.memo((props)=>{
  return (
    <div style={{marginLeft:"auto", marginRight:"auto", maxWidth:"fit-content"}}>
      <Plot
        data={[{
          showlegend: false,
          showscale:false,
          z: props.z_data,
          type: 'heatmap',
          colorscale: 'Greys',
        }]}
        layout={{
          width:1441,
          height:821,
          title: {
            text: 'Debug Register Output'
          },
          xaxis: {
            visible: false,
            fixedrange: true
          },
          yaxis: {
            visible: false,
            fixedrange: true
          }
        }}
      />
    </div>
  )
}, isEqual);

//convert the array of data we are given into a 2d array, then create a heatmap using the plotly library (component defined separately) using that data
function get_debug_register(periodicEndpoint){
  var z_data = []
  for (let x = 0; x < 64; x++){
    var temp = []
    for (let y = 0; y < 128; y++){
      temp.push(0)
    }
    z_data.push(temp)
  }
  for (let i = 0; i < periodicEndpoint.data.application.debugreg.pixel_data.length; i++){
    z_data[63-Math.floor(i/128)][i%128] = periodicEndpoint.data.application.debugreg.pixel_data[i]
  }
  return <Heatmap z_data={z_data}/>
}

export default function App(){
  //create the endpoint to use to contact the adapter, at the address specified in the .env file,
  //polling it to get the most recent parameter tree every 500 milliseconds
  const periodicEndpoint = useAdapterEndpoint("detector", process.env.REACT_APP_ENDPOINT_URL, 1000);
  const periodicEndpointPower = useAdapterEndpoint("proxy", process.env.REACT_APP_ENDPOINT_URL, 1000);
  const [loadInput, setLoadInput] = useState("None");
  if (Object.keys(configs).length > 0 && loadInput == "None"){
    setLoadInput(Object.keys(configs)[0]);
  }
  const [debug_reg_input, set_debug_reg_input] = useState([]);
  if (debug_reg_input.length == 0){
    var z_data = []
    for (let x = 0; x < 64; x++){
      var temp = []
      for (let y = 0; y < 128; y++){
        temp.push(0)
      }
      z_data.push(temp)
    }
    set_debug_reg_input(z_data)
  }
  
  let colours = ['#000','#fff']
  const [activeColourIndex, set_active_colour_index] = useState(1);
  const [mouseDown, setMouseDown] = useState(false)
  document.body.onmousedown = () => setMouseDown(true)
  document.body.onmouseup = () => setMouseDown(false)
  const [pixels, set_pixels] = useState([]);
  if (pixels.length == 0){
    var temp = []
    for (let i = 0; i < 8192; i++){
      temp.push(0)
      set_pixels(temp)
    }
  }

  return (
    <OdinApp title="GARUD"
    navLinks={["Main", "GPIO Direct", "Configuration", "Debug Register Test", "Detector JSON", "Power Supply JSON"]}
    icon_src="odin.png">
      <Container>
        <div className="odin-server">
          <TitleCard title={<><p style={{float:"left"}}>Controls</p></>}>
            <TitleCard title={<><p style={{float:"left"}}>Power Supplies</p><p style={{float:"right"}}>{"Total Power: " + (Object.keys(periodicEndpointPower.data).length > 0 ? get_total_power(periodicEndpointPower) : "-") + " W"}</p></>}>
            {Object.keys(periodicEndpointPower.data).length > 0 ? 
              get_power_supplies(periodicEndpointPower) : 
              <><p style={{color:"red"}}>Error - no data received from adapter:</p><pre style={{color:"red"}}>{JSON.stringify(periodicEndpointPower.data, null, " ")}</pre></>}
            </TitleCard>
          </TitleCard>
          <br/>
        </div>
      </Container>
      <Container>
        <div className="odin-server">
          <TitleCard title={<><p style={{float:"left"}}>Controls</p>{GetSaveLoadBar([loadInput, setLoadInput], periodicEndpoint)}</>}>
            <div className="wrap-and-compress">
              {Object.keys(periodicEndpoint.data).length > 0 ? 
              GetToggles(periodicEndpoint, true) : 
              <><p style={{color:"red"}}>Error - no data received from adapter:</p><pre style={{color:"red"}}>{JSON.stringify(periodicEndpoint.data, null, " ")}</pre></>}
            </div>
          </TitleCard>
          <br/>
          <TitleCard title="Debug inputs">
            <div className="overlay"/>
            <div className="wrap-and-compress">
              {Object.keys(periodicEndpoint.data).length > 0 ? 
              GetToggles(periodicEndpoint, false) : 
              <><p style={{color:"red"}}>Error - no data received from adapter:</p><pre style={{color:"red"}}>{JSON.stringify(periodicEndpoint.data, null, " ")}</pre></>}
            </div>
          </TitleCard>
          <br/>
        </div>
      </Container>
      <Container>
        <div className="odin-server">
          <TitleCard title={<><p style={{float:"left"}} >DACs</p> {GetButtons(periodicEndpoint, resetDACsToValues, "dacs")}
          <input onClick={() => ResetDACs(periodicEndpoint)} style={{float:"right", marginRight:"5px"}} className="nice-button" type="button" value="Reset to defaults"/></>}>
            <div>
            {Object.keys(periodicEndpoint.data).length > 0 ? 
              GetDACs(periodicEndpoint) : 
              <><p style={{color:"red"}}>Error - no data received from adapter:</p><pre style={{color:"red"}}>{JSON.stringify(periodicEndpoint.data, null, " ")}</pre></>}
            </div>
          </TitleCard>
          <br/>
          <TitleCard title={<><p style={{float:"left"}}>Configuration Shift-Register</p>{GetButtons(periodicEndpoint, resetSRConfig, "configbits")}</>}>
            
            <div>
            {Object.keys(periodicEndpoint.data).length > 0 ? 
              GetConfigs(periodicEndpoint) : 
              <><p style={{color:"red"}}>Error - no data received from adapter:</p><pre style={{color:"red"}}>{JSON.stringify(periodicEndpoint.data, null, " ")}</pre></>}
            </div>
          </TitleCard>
          <br/>
          <TitleCard title={<><p style={{float:"left"}}>Readout Config</p>{GetButtons(periodicEndpoint, resetReadoutConfig, "readoutconfig")}</>}>
            <div>
            {Object.keys(periodicEndpoint.data).length > 0 ? 
              GetReadoutConfig(periodicEndpoint) : 
              <><p style={{color:"red"}}>Error - no data received from adapter:</p><pre style={{color:"red"}}>{JSON.stringify(periodicEndpoint.data, null, " ")}</pre></>}
            </div>
          </TitleCard>
          <br/>
        </div>
      </Container>
      <Container>
        <div className="odin-server">
          <PixelGrid title="Debug Register Input" pixels={pixels} set_pixels={set_pixels} mouseDown={mouseDown} colours={colours} activeColourIndex={activeColourIndex} set_active_colour_index={set_active_colour_index}/>
          <br/>
          <TitleCard title="Debug Register Output">
            {Object.keys(periodicEndpoint.data).length > 0 ? 
                <>{get_debug_register(periodicEndpoint)}</>
              : <><p style={{color:"red"}}>Error - no data received from adapter:</p><pre style={{color:"red"}}>{JSON.stringify(periodicEndpoint.data, null, " ")}</pre></>}
          </TitleCard>
          <br/>
        </div>
      </Container>
      <Container>
        <div className="odin-server">
          <TitleCard title="Detector JSON">
            <pre dangerouslySetInnerHTML={{__html: format_json(JSON.stringify(periodicEndpoint.data, null, "    "), 1)}}></pre>
          </TitleCard>
          <br/>
        </div>
      </Container>
      <Container>
        <div className="odin-server">
          <TitleCard title="Power Supply JSON">
            <pre dangerouslySetInnerHTML={{__html: format_json(JSON.stringify(periodicEndpointPower.data, null, "    "), 1)}}></pre>
          </TitleCard>
          <br/>
        </div>
      </Container>
    </OdinApp> 
  );
}
