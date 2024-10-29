import { useState, useEffect, createRef, useImperativeHandle, useRef, forwardRef } from "react";
import React from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { OdinApp, useAdapterEndpoint, WithEndpoint, DropdownSelector, TitleCard,} from 'odin-react';
import 'odin-react/dist/index.css';
import './styles.css';
import Container from 'react-bootstrap/Container';
import InputGroup from 'react-bootstrap/InputGroup';
import Dropdown from 'react-bootstrap/Dropdown';
import Switch from "react-switch";
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
          <label id={id} style={{fontSize:"1.02vw", marginRight: "4px"}}>
      {label}:
    </label>
    <div style={{height:"1px", width:"5000px"}}></div>
    <div style={{float:"right"}}>
    <Switch
        ref={ref}
        checked={ischecked} onChange={toggle} disabled={disabled}
        onColor="#86d3ff" onHandleColor="#2693e6" handleDiameter={25}
        boxShadow="0px 1px 5px rgba(0, 0, 0, 0.6)" activeBoxShadow="0px 0px 1px 10px rgba(0, 0, 0, 0.2)"
        height={20} width={48}
        aria-labelledby={id} />
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
  var current = paramTree;
  for (let pathSection of path){
    var current = current[pathSection];
  }
  return current;
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
  const [repeatTrigger, setRepeatTrigger] = useState(0);

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
  
  //prevents most keys from having an effect, except: the keys 0 and 1, the keys 2-9, when we are accepting denary inputs, 
  //the backspace key, the delete key and the left and right arrow keys.
  function preventNonNumericCharacters(event) {
    var whitelist = [8, 12, 33, 34, 35, 36, 37, 38, 39, 40, 46,]
    var e = event || window.event;  
    var key = e.keyCode || e. which;
    if (numberType == "Binary"){
      if ((key < 48 || key > 49)&& !whitelist.includes(key)) {
        if (e.preventDefault){
          e.preventDefault();
        } 
        e.returnValue = false;
      } 
    } 
    else if (numberType == "Denary"){                             
      if ((key < 48 || key > 57)&&(key != 8)&&(key != 46)&&(key != 37)&&(key != 39)) {
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
        props.endpoint.put({[props.accessor]:event.target.value}, props.pathToDACs.join("/"))
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
  const pathToDACs = ["application", "dacs"];

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
      <div style={{display:"inline-block", minWidth:"300px", width:"31%", marginRight:"0.5%", marginLeft:"0.5%", borderWidth:"1px", borderColor:"#dee2e6", borderRadius:"5px", backgroundColor:"#f8f9fa", marginBottom:"5px", borderStyle:"solid", padding:"5px"}}>
      <DAC ref={DACRefs[DACRefs.length-1].ref} endpoint={periodicEndpoint} accessor={key} pathToDACs={pathToDACs} default={DACDefaults[key.toUpperCase()]}/>
      </div>
      </>);
  }
  return DACs;
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


export default function App(){
  // create the endpoint to use to contact the adapter, at the address specified in the .env file,
  //polling it to get the most recent parameter tree every 500 milliseconds
  const periodicEndpoint = useAdapterEndpoint("detector", process.env.REACT_APP_ENDPOINT_URL, 500);
  const [loadInput, setLoadInput] = useState("None");
  if (Object.keys(configs).length > 0 && loadInput == "None"){
    setLoadInput(Object.keys(configs)[0]);
  }

  return (
    <OdinApp title="GARUD"
    navLinks={["GPIO Direct", "DACs", "JSON"]}
    icon_src="odin.png">
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
          <TitleCard title={<><p style={{float:"left"}} >DACs</p><input onClick={() => ResetDACs(periodicEndpoint)} style={{float:"right", color:"white", backgroundColor:"#0d6efd", borderColor:"#0d6efd", borderStyle:"solid", borderRadius:"5px"}} type="button" value="Reset to defaults"/></>}>
            <div>
            {Object.keys(periodicEndpoint.data).length > 0 ? 
              GetDACs(periodicEndpoint) : 
              <><p style={{color:"red"}}>Error - no data received from adapter:</p><pre style={{color:"red"}}>{JSON.stringify(periodicEndpoint.data, null, " ")}</pre></>}
            </div>
          </TitleCard>
        </div>
      </Container>
      <Container>
        <div className="odin-server">
          <TitleCard title="JSON">
            <pre dangerouslySetInnerHTML={{__html: format_json(JSON.stringify(periodicEndpoint.data, null, "    "), 1)}}></pre>
          </TitleCard>
          <br/>
        </div>
      </Container>
    </OdinApp> 
  );
}
