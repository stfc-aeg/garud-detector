import {
  useState,
  useEffect,
  createRef,
  useImperativeHandle,
  useRef,
} from "react";
import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { WithEndpoint } from "odin-react";
import "odin-react/dist/index.css";
import "./styles.css";
import InputGroup from "react-bootstrap/InputGroup";
import Button from "react-bootstrap/Button";
import Switch from "react-switch";
import { getNested, format_string } from "./helperFunctions";

//Dictionary of the default binary values for each DAC
const DACDefaults = {
  I_PIXEL_COLUMN_BIAS: "010110",
  I_PGA_GAIN_BIAS2: "101101",
  I_PGA_GAIN_BIAS: "001001",
  I_PAG_OFF: "001011",
  I_ADC_DRIVER_BIAS: "001001",
  V_ADC_CASC_UP_BIAS: "010011",
  V_ADC_CASC_DOWN_BIAS: "101011",
  I_DAC_EXT_REF: "001001",
  I_ADC_BIAS_1: "010001",
  I_ADC_BIAS_2: "010001",
  I_ADC_BIAS_3: "010001",
  I_ADC_PLL_BIAS: "010010",
  I_UFRC_PLL_BIAS: "010010",
  I_UFRC_CML_P_BIAS: "011100",
  I_UFRC_CML_N_BIAS: "011000",
};

/* A list of dictionaries - each dictionary will have the following structure 
  {
  "key": - stores the key to this DAC in the parameter tree
  "path": - stores the path to the dac section of the parameter tree
  "default" - stores the default value of this dac
  "inputRef" - stores a reference to the DAC functional component
  }
  */
var DACRefs = [];
var SRConfigs = [];
var readoutConfigs = [];

const EndpointButton = WithEndpoint(Button);

//a functional component to display a input box, to edit the value of the dac, a toggle, to switch whether
//you are inputting binary or denary numbers, and a bit of text showing the default value for this dac
const DAC = React.forwardRef((props, ref) => {
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
    },
  }));
  //A toggle to determine whether we are showing and inputing binary values or denary values
  const [numberType, setNumberType] = useState("Denary");
  const input = (
    <input
      className="textInput"
      type="number"
      defaultValue={getValue()}
      ref={inputRef}
      onKeyDown={preventNonNumericCharacters}
      onChange={onChangeInput}
    ></input>
  );

  //   const [repeatTrigger, setRepeatTrigger] = useState(0);

  //   useEffect(() => {
  //     //if the textbox for this DAC is not in focus (currently selected)
  //     if (document.activeElement !== inputRef.current) {
  //       reload();
  //     }
  //     //Repeat this process in 1000 milliseconds (repeatTrigger variable is solely used to cause a dependency update in 1000 seconds, causing a rerun of this function.)
  //     setTimeout(() => {
  //       setRepeatTrigger(repeatTrigger + 1);
  //     }, 1000);
  //   }, [repeatTrigger]);

  //   //update the currently shown value with the actual value from the parameter tree
  //   function reload() {
  //     if (inputRef != null)
  //       if (
  //         inputRef.current.value != getValue() &&
  //         inputRef.current.value != parseInt(String(getValue()), 2)
  //       ) {
  //         if (numberType == "Binary") {
  //           inputRef.current.value = Number(getValue()).toString(2);
  //         } else if (numberType == "Denary") {
  //           inputRef.current.value = getValue();
  //         }
  //       }
  //   }

  //Switch the input between accepting and showing binary numbers and accepting and showing denary numbers
  function toggleNumType() {
    if (numberType == "Binary") {
      setNumberType("Denary");
      //convert the currently shown binary value to denary
      inputRef.current.value = parseInt(String(inputRef.current.value), 2);
    } else if (numberType == "Denary") {
      setNumberType("Binary");
      //convert the currently shown denary value to binary
      inputRef.current.value = Number(inputRef.current.value).toString(2);
    }
  }

  //prevents most keys from having an effect, except: the keys 0 and 1, the keys 2-9 when we are accepting denary inputs,
  //the backspace key, the delete key and the left and right arrow keys.
  function preventNonNumericCharacters(event) {
    var whitelist = [8, 12, 33, 34, 35, 36, 37, 39, 46];
    var e = event || window.event;
    var key = e.keyCode || e.which;
    console.log(key);
    if (numberType == "Binary") {
      if (
        (key < 48 || key > 49) &&
        key != 96 &&
        key != 97 &&
        !whitelist.includes(key)
      ) {
        if (e.preventDefault) {
          e.preventDefault();
        }
        e.returnValue = false;
      }
    } else if (numberType == "Denary") {
      if (
        (key < 48 || key > 57) &&
        (key < 96 || key > 105) &&
        key != 8 &&
        key != 46 &&
        key != 37 &&
        key != 39
      ) {
        if (e.preventDefault) {
          e.preventDefault();
        }
        e.returnValue = false;
      }
    }
  }

  function getValue() {
    var value = parseInt(Number(props.default), 2);
    if (
      getNested(props.endpoint.data, props.pathToDACs)[props.accessor] != null
    ) {
      value = getNested(props.endpoint.data, props.pathToDACs)[props.accessor];
    } else {
      props.endpoint
        .put(
          { [props.accessor]: String(parseInt(Number(props.default), 2)) },
          props.pathToDACs.join("/")
        )
        .then((response) => {
          props.endpoint.mergeData(response, props.pathToDACs.join("/"));
        })
        .catch((err) => {
          console.error(err);
        });
    }
    return value;
  }

  function onChangeInput(event) {
    //Restrict the binary input to 6 digits
    if (numberType == "Binary" && event.target.value.length > 6) {
      event.target.value = event.target.value.slice(0, 6);
    }
    //Restrict the denary inputs to 2 digits long and a maximum of 63 (the maximum binary value you can have in 6 digits)
    else if (numberType == "Denary" && event.target.value.length > 2) {
      event.target.value = event.target.value.slice(0, 2);
    }
    if (numberType == "Denary" && Number(event.target.value) > 63) {
      event.target.value = "63";
    } else if (event.target.value != "") {
      if (numberType == "Binary") {
        //send the inputted value to the adapter, converting from binary to denary, and load the response into the parameter tree
        props.endpoint
          .put(
            { [props.accessor]: parseInt(String(event.target.value), 2) },
            props.pathToDACs.join("/")
          )
          .then((response) => {
            props.endpoint.mergeData(response, props.pathToDACs.join("/"));
          })
          .catch((err) => {
            console.error(err);
          });
      } else if (numberType == "Denary") {
        //send the inputted value to the adapter, and load the response into the parameter tree
        props.endpoint
          .put(
            { [props.accessor]: Number(event.target.value) },
            props.pathToDACs.join("/")
          )
          .then((response) => {
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
      <div className="box" style={{ padding: "5px" }}>
        <p style={{ marginBottom: "0px", float: "left" }}>
          {format_string(props.accessor) + ":"}
        </p>
        &nbsp;
        {input}&nbsp;
      </div>
      <InputGroup.Text>
        <label style={{ marginRight: "4px" }}>Binary:</label>
        <div style={{ height: "1px", width: "5000px" }}></div>
        <div style={{ float: "right" }}>
          <Switch
            ref={toggleRef}
            checked={numberType == "Binary"}
            onChange={toggleNumType}
            onColor="#86d3ff"
            onHandleColor="#2693e6"
            handleDiameter={25}
            boxShadow="0px 1px 5px rgba(0, 0, 0, 0.6)"
            activeBoxShadow="0px 0px 1px 10px rgba(0, 0, 0, 0.2)"
            height={20}
            width={48}
          />
        </div>
      </InputGroup.Text>
      <InputGroup.Text>
        <p style={{ marginBottom: "0px" }}>
          Default:{" "}
          {numberType == "Binary"
            ? props.default
            : parseInt(Number(props.default), 2)}
        </p>
      </InputGroup.Text>
    </>
  );
});

export function DACReadouts(props) {
  var DACs = [];
  const pathToDACs = ["application", "dacs", "FIELDS"];

  for (let key of Object.keys(
    getNested(props.periodicEndpoint.data, pathToDACs)
  )) {
    //store all the data we need to access this component later so that we can reset it to default if necessary.
    DACRefs.push({
      key: key,
      path: pathToDACs,
      default: DACDefaults[key.toUpperCase()],
      ref: createRef(),
    });

    DACs.push(
      <>
        <div
          style={{
            display: "inline-block",
            minWidth: "300px",
            width: "32%",
            marginRight: "0.5%",
            marginLeft: "0.5%",
            borderWidth: "1px",
            borderColor: "#dee2e6",
            borderRadius: "5px",
            backgroundColor: "#f8f9fa",
            marginBottom: "5px",
            borderStyle: "solid",
            padding: "5px",
          }}
        >
          <DAC
            ref={DACRefs[DACRefs.length - 1].ref}
            endpoint={props.periodicEndpoint}
            accessor={key}
            pathToDACs={pathToDACs}
            default={DACDefaults[key.toUpperCase()]}
          />
        </div>
      </>
    );
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
    },
  }));
  const input = (
    <input
      style={{ float: "right" }}
      className="textInput"
      type="number"
      defaultValue={getValue()}
      ref={inputRef}
      onKeyDown={preventNonNumericCharacters}
      onChange={onChangeInput}
    ></input>
  );
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
    var whitelist = [8, 12, 33, 34, 35, 36, 37, 39, 46];
    var e = event || window.event;
    var key = e.keyCode || e.which;
    if (
      (key < 48 || key > 49) &&
      key != 96 &&
      key != 97 &&
      !whitelist.includes(key)
    ) {
      if (e.preventDefault) {
        e.preventDefault();
      }
      e.returnValue = false;
    }
  }

  //get the value for this input from the path
  function getValue() {
    return getNested(props.endpoint.data, props.pathToConfigs)[props.accessor];
  }

  function onChangeInput(event) {
    //if the value in the text box is longer than one character, cut it back down to one character.
    event.target.value = event.target.value.slice(0, 1);
    if (event.target.value != "") {
      //send the inputted value to the adapter, and load the response into the parameter tree
      props.endpoint
        .put(
          { [props.accessor]: Number(event.target.value) },
          props.pathToConfigs.join("/")
        )
        .then((response) => {
          props.endpoint.mergeData(response, props.pathToConfigs.join("/"));
        })
        .catch((err) => {
          console.error(err);
        });
    }
  }

  return (
    <>
      <div className="box" style={{ padding: "5px" }}>
        <div style={{ width: "100%" }}>
          <p style={{ marginBottom: "0px", float: "left" }}>
            {format_string(props.accessor) + ":"}
          </p>
          &nbsp;
          {input}&nbsp;
        </div>
      </div>
    </>
  );
});

export function ConfigDisplay(props) {
  var configs = [];
  const pathToConfigs = ["application", "configbits", "FIELDS"];

  for (let key of Object.keys(
    getNested(props.periodicEndpoint.data, pathToConfigs)
  )) {
    //store all the data we need to access this component later
    SRConfigs.push({
      key: key,
      ref: createRef(),
    });
    configs.push(
      <>
        <div
          style={{
            display: "inline-block",
            minWidth: "300px",
            width: "32%",
            marginRight: "0.5%",
            marginLeft: "0.5%",
            borderWidth: "1px",
            borderColor: "#dee2e6",
            borderRadius: "5px",
            backgroundColor: "#f8f9fa",
            marginBottom: "5px",
            borderStyle: "solid",
            padding: "5px",
          }}
        >
          <Config
            ref={SRConfigs[SRConfigs.length - 1].ref}
            endpoint={props.periodicEndpoint}
            accessor={key}
            pathToConfigs={pathToConfigs}
          />
        </div>
      </>
    );
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
  const input1 = (
    <input
      style={{ float: "right" }}
      className="textInput"
      type="number"
      defaultValue={getValue("AB_GATE_EN")}
      ref={inputRef1}
      onKeyDown={preventNonNumericCharacters}
      onChange={(event) => onChangeInput(event, "AB_GATE_EN")}
    ></input>
  );
  const input2 = (
    <input
      style={{ float: "right" }}
      className="textInput"
      type="number"
      defaultValue={getValue("2_LEVEL_READOUT")}
      ref={inputRef2}
      onKeyDown={preventNonNumericCharacters}
      onChange={(event) => onChangeInput(event, "2_LEVEL_READOUT")}
    ></input>
  );
  const input3 = (
    <input
      style={{ float: "right" }}
      className="textInput"
      type="number"
      defaultValue={getValue("BLOCK_ENABLE")}
      ref={inputRef3}
      onKeyDown={preventNonNumericCharacters}
      onChange={(event) => onChangeInput(event, "BLOCK_ENABLE")}
    ></input>
  );
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
    }, [repeatTrigger])

  //update the currently shown value with the actual value from the parameter tree
  function reload(inputRef, accessor) {
    if (inputRef != null)
      if (inputRef.current.value != getValue(accessor)) {
        inputRef.current.value = getValue(accessor)?.toString();
      }
  }*/

  //prevents most keys from having an effect, except: the keys 0 and 1, the backspace key, the delete key and the left and right arrow keys.
  function preventNonNumericCharacters(event) {
    var whitelist = [8, 12, 33, 34, 35, 36, 37, 39, 46];
    var e = event || window.event;
    var key = e.keyCode || e.which;
    if (
      (key < 48 || key > 49) &&
      key != 96 &&
      key != 97 &&
      !whitelist.includes(key)
    ) {
      if (e.preventDefault) {
        e.preventDefault();
      }
      e.returnValue = false;
    }
  }

  //get the value of a input from the parameter tree
  function getValue(accessor) {
    return getNested(props.endpoint.data, props.pathToConfigs)[props.accessor][
      accessor
    ];
  }

  function onChangeInput(event, accessor) {
    //if the input is more than one character long cut it back down to one character
    event.target.value = event.target.value.slice(0, 1);

    if (accessor == "2_LEVEL_READOUT" && event.target.value != "") {
      for (let config of readoutConfigs) {
        if (config.ref.current != null) {
          config.ref.current.input2.value = event.target.value;
          props.endpoint
            .put(
              { [accessor]: Number(event.target.value) },
              props.pathToConfigs.join("/") + "/" + config.key
            )
            .then((response) => {
              props.endpoint.mergeData(
                response,
                props.pathToConfigs.join("/") + "/" + config.key
              );
            })
            .catch((err) => {
              console.error(err);
            });
        }
      }
    } else {
      if (event.target.value != "") {
        //send the inputted value to the adapter, and load the response into the parameter tree
        props.endpoint
          .put(
            { [accessor]: Number(event.target.value) },
            props.pathToConfigs.join("/") + "/" + props.accessor
          )
          .then((response) => {
            props.endpoint.mergeData(
              response,
              props.pathToConfigs.join("/") + "/" + props.accessor
            );
          })
          .catch((err) => {
            console.error(err);
          });
      }
    }
  }

  return (
    <>
      <div className="box" style={{ padding: "5px" }}>
        <p style={{ marginBottom: "0px", width: "100%" }}>
          {format_string(props.accessor) + ":"}
        </p>
        <div
          style={{
            width: "100%",
            height: "1px",
            backgroundColor: "black",
            marginTop: "2px",
            marginBottom: "6px",
          }}
        ></div>
        <div style={{ width: "100%" }}>
          <p style={{ marginBottom: "0px", float: "left" }}>AB_GATE_EN:</p>
          &nbsp;{input1}
        </div>
        <div style={{ width: "100%" }}>
          <p style={{ marginBottom: "0px", float: "left" }}>2_LEVEL_READOUT:</p>
          &nbsp;{input2}
        </div>
        <div style={{ width: "100%" }}>
          <p style={{ marginBottom: "0px", float: "left" }}>BLOCK_ENABLE:</p>
          &nbsp;{input3}
        </div>
      </div>
    </>
  );
});

export function ReadoutConfigDisplay(props) {
  var configs = [];
  const pathToConfigs = ["application", "readoutconfig", "FIELDS"];

  for (let key of Object.keys(
    getNested(props.periodicEndpoint.data, pathToConfigs)
  )) {
    //store all the data we need to access this component later
    readoutConfigs.push({
      key: key,
      ref: createRef(),
    });
    configs.push(
      <>
        <div
          style={{
            display: "inline-block",
            minWidth: "300px",
            width: "24%",
            marginRight: "0.5%",
            marginLeft: "0.5%",
            borderWidth: "1px",
            borderColor: "#dee2e6",
            borderRadius: "5px",
            backgroundColor: "#f8f9fa",
            marginBottom: "5px",
            borderStyle: "solid",
            padding: "5px",
          }}
        >
          <ReadoutConfig
            ref={readoutConfigs[readoutConfigs.length - 1].ref}
            endpoint={props.periodicEndpoint}
            accessor={key}
            pathToConfigs={pathToConfigs}
          />
        </div>
      </>
    );
  }
  return configs;
}

/**
 * iterate through each dac and reset its response to the default, before updating the adapter with the default value.
 * @param {adapterEndpoint} periodicEndpoint - the endpoint to use to update the DAC values
 */
export function ResetDACs(periodicEndpoint) {
  for (let dac of DACRefs) {
    if (dac.ref.current != null) {
      //if the toggle is checked, this DAC is in binary mode
      if (dac.ref.current.toggle.props.checked) {
        dac.ref.current.input.value = dac.default;
        periodicEndpoint
          .put(
            { [dac.key]: parseInt(String(dac.ref.current.input.value), 2) },
            dac.path.join("/")
          )
          .then((response) => {
            periodicEndpoint.mergeData(response, dac.path.join("/"));
          })
          .catch((err) => {
            console.error(err);
          });
      }
      //the toggle is not checked, this DAC should show the denary value
      else {
        dac.ref.current.input.value = parseInt(Number(dac.default), 2);
        periodicEndpoint
          .put({ [dac.key]: dac.ref.current.input.value }, dac.path.join("/"))
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

//Overwrite the values currently in the Config inputs (see config functional component) with the values in the parameter tree
export function resetSRConfig(endpoint) {
  var pathToSRConfigs = ["application", "configbits"];
  endpoint
    .put({ ["RESTORE"]: true }, pathToSRConfigs.join("/"))
    .then((response) => {
      endpoint.mergeData(response, pathToSRConfigs.join("/"));
      var data = getNested(endpoint.data, pathToSRConfigs);
      for (let config of SRConfigs) {
        if (config.ref.current != null) {
          config.ref.current.input.value = data["FIELDS"][config.key];
        }
      }
    })
    .catch((err) => {
      console.error(err);
    });
}

//Overwrite the values currently in the DAC inputs (see DAC functional component) with the values in the parameter tree
export function resetDACsToValues(endpoint) {
  var pathToDACs = ["application", "dacs"];
  endpoint
    .put({ ["RESTORE"]: true }, pathToDACs.join("/"))
    .then((response) => {
      endpoint.mergeData(response, pathToDACs.join("/"));
      var data = getNested(endpoint.data, pathToDACs);
      for (let config of DACRefs) {
        if (config.ref.current != null) {
          config.ref.current.input.value = data["FIELDS"][config.key];
        }
      }
    })
    .catch((err) => {
      console.error(err);
    });
}

//Overwrite the values currently in the ReadoutConfig inputs (see ReadoutConfig functional component) with the values in the parameter tree
export function resetReadoutConfig(endpoint) {
  var pathToConfig = ["application", "readoutconfig"];
  endpoint
    .put({ ["RESTORE"]: true }, pathToConfig.join("/"))
    .then((response) => {
      endpoint.mergeData(response, pathToConfig.join("/"));
      var data = getNested(endpoint.data, pathToConfig);
      for (let config of readoutConfigs) {
        if (config.ref.current != null) {
          config.ref.current.input1.value =
            data["FIELDS"][config.key]["AB_GATE_EN"];
          config.ref.current.input2.value =
            data["FIELDS"][config.key]["2_LEVEL_READOUT"];
          config.ref.current.input3.value =
            data["FIELDS"][config.key]["BLOCK_ENABLE"];
        }
      }
    })
    .catch((err) => {
      console.error(err);
    });
}

//Generate the buttons for the title bar of the configuration registers - two buttons, one of which resets any changed values to their true values, and one which applies any changed values.
export function ApplyResetConfigButtons(props) {
  if (
    Object.keys(props.periodicEndpoint.data).length > 0 &&
    !props.periodicEndpoint.data.application[props.type].SYNC_ON_WRITE
  ) {
    return (
      <>
        {/* {Object.keys(props.periodicEndpoint.data).length > 0 &&
        !props.periodicEndpoint.data.application[props.type].SYNC ? ( */}
        <input
          onClick={() => props.func_to_run(props.periodicEndpoint)}
          style={{ float: "right" }}
          className="nice-button"
          type="button"
          value="Reset to true values"
        />
        {/* ) : (
        <input
          style={{ float: "right" }}
          className="disabled-button"
          type="button"
          disabled
          value="Reset to true values"
        />
        )} */}
        {Object.keys(props.periodicEndpoint.data).length > 0 &&
        !props.periodicEndpoint.data.application[props.type].SYNC ? (
          <EndpointButton
            style={{ float: "right", marginRight: "5px" }}
            endpoint={props.periodicEndpoint}
            event_type="click"
            fullpath={"application/" + props.type + "/SYNC"}
            value={true}
          >
            Apply
          </EndpointButton>
        ) : (
          <EndpointButton
            style={{
              float: "right",
              marginRight: "5px",
              backgroundColor: "grey",
              borderColor: "grey",
            }}
            fullpath={"application/" + props.type + "/SYNC"}
            endpoint={props.periodicEndpoint}
            disabled
          >
            Apply
          </EndpointButton>
        )}
      </>
    );
  } else {
    return <></>;
  }
}
