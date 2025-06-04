import { useState, createRef } from "react";
import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { DropdownSelector, TitleCard } from "odin-react";
import "odin-react/dist/index.css";
import "./styles.css";
import Dropdown from "react-bootstrap/Dropdown";
import { format_string, getNested } from "./helperFunctions";
import { Toggle } from "./Toggle";

//A list used to store references to each toggle so that we can save the values of them all, or overwrite their values with a saved set.
var toggleRefs = [];
//reference to the textbox for entering a config save name, so that we can get the name entered when the save button is pressed and save it using that name
var saveInputRef = createRef();
//the list of configs we could use
var configs = JSON.parse(localStorage.getItem("configs"));
if (configs == null || configs == undefined) {
  configs = {};
}

export function Toggles(props) {
  const pathToIOPins = ["application", "gpio_direct"];
  var toggles = [];

  for (let key of Object.keys(
    getNested(props.periodicEndpoint.data, pathToIOPins)
  )) {
    if (!props.debugInputList.includes(key.toLowerCase()) && props.isOutput) {
      toggleRefs.push({
        name: key,
      });
      if (
        Object.keys(
          getNested(props.periodicEndpoint.data, pathToIOPins)[key]
        ).includes("mux_source_fw")
      ) {
        //if the toggle is under software control create a normal toggle
        if (
          !getNested(props.periodicEndpoint.data, pathToIOPins)[key][
            "mux_source_fw"
          ]
        ) {
          toggles.push(
            <Toggle
              endpoint={props.periodicEndpoint}
              path={[...pathToIOPins, key]}
              accessor={"state"}
              label={<>{format_string(String(key))}</>}
              number={true}
            />
          );
          //if the toggle is under firmware control recolor it light red and add text to say it is under firmware control
        } else {
          toggles.push(
            <Toggle
              endpoint={props.periodicEndpoint}
              path={[...pathToIOPins, key]}
              accessor={"state"}
              color="#FF8080"
              label={<>{format_string(String(key))} &nbsp; (FW control)</>}
              number={true}
            />
          );
        }
        //if the toggle does not have the option for firmware or software control create a normal toggle
      } else {
        toggles.push(
          <Toggle
            endpoint={props.periodicEndpoint}
            path={[...pathToIOPins, key]}
            accessor={"state"}
            label={<>{format_string(String(key))}</>}
            number={true}
          />
        );
      }
    }
    if (props.debugInputList.includes(key.toLowerCase()) && !props.isOutput) {
      toggles.push(
        <Toggle
          endpoint={props.periodicEndpoint}
          path={pathToIOPins}
          accessor={key}
        />
      );
    }
  }
  return toggles;
}

//get the save and load boxes and their inputs displayed in the controls titlecard's title section
export function SaveLoadBar(props) {
  //stores the name of the currently selected config so we can load it when the load config button is pressed
  const [loadInput, setLoadInput] = useState("None");
  if (Object.keys(configs).length > 0 && loadInput == "None") {
    setLoadInput(Object.keys(configs)[0]);
  }

  return (
    <div style={{ float: "right" }}>
      <div style={{ marginRight: "20px", display: "inline-block" }}>
        <TitleCard title="Save">
          <input
            onClick={() => saveConfig(props.endpoint)}
            style={{
              display: "inline-block",
              height: "38px",
              width: "47%",
              color: "white",
              backgroundColor: "#0d6efd",
              borderColor: "#0d6efd",
              borderStyle: "solid",
              borderRadius: "5px",
            }}
            type="button"
            value="Save configuration as"
          />
          &nbsp;
          <input
            className="textInput"
            ref={saveInputRef}
            style={{ display: "inline-block", height: "38px", width: "51%" }}
            type="text"
            defaultValue="config"
          />
        </TitleCard>
      </div>
      <div style={{ display: "inline-block" }}>
        <TitleCard title="Load">
          <DropdownSelector
            buttonText={loadInput || "None"}
            onSelect={(event) => setLoadInput(event)}
          >
            {Object.keys(configs).map((selection, index) => (
              <Dropdown.Item
                eventKey={selection}
                key={index}
                active={selection == loadInput}
              >
                {selection}
              </Dropdown.Item>
            ))}
          </DropdownSelector>{" "}
          &nbsp;
          <input
            onClick={() => loadConfig(loadInput, props.endpoint)}
            style={{
              display: "inline-block",
              height: "38px",
              color: "white",
              backgroundColor: "#0d6efd",
              borderStyle: "none",
              borderRadius: "5px",
            }}
            type="button"
            value="Load configuration"
          />
        </TitleCard>
      </div>
    </div>
  );
}

//Save the current configuration of the toggles to localstorage, under the name currently in the input field (default config)
function saveConfig(endpoint) {
  var path = ["application", "gpio_direct"];
  var configDict = {};
  //iterate through each toggle and get its state
  for (let toggle of toggleRefs) {
    configDict[toggle.name] = getNested(endpoint.data, path)[toggle.name];
  }

  configs[saveInputRef.current.value] = configDict;
  //store the data in the browser's local storage
  localStorage.setItem("configs", JSON.stringify(configs));
  //display an alert to show that the save was successful
  alert("Save successful.");
}

//Notify the user if no saved config is available to load. Otherwise, load the currently selected config
function loadConfig(loadInput, endpoint) {
  if (loadInput == "None") {
    alert("No save selected.");
    return;
  }
  console.log(configs[loadInput]);
  applyConfig(configs[loadInput], endpoint);
}

//loop through each of the toggles in the loaded config, and generate a dictionary that can be used to update the adapter, which will then itself update the toggles
function applyConfig(config, endpoint) {
  const pathToIOPins = ["application", "gpio_direct"];
  var dict = {};

  for (let toggleRef of toggleRefs) {
    dict[toggleRef.name] = config[toggleRef.name];
  }
  //rather than updating the toggles, send the updated states to the adapter. Once the adapter's state changes, the toggles will change to match it.
  endpoint
    .put({ ["gpio_direct"]: dict }, "application")
    .then((response) => {
      endpoint.mergeData(response, "application");
    })
    .catch((err) => {
      console.error(err);
    });
}
