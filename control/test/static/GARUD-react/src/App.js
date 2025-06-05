import { useState } from "react";
import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  OdinApp,
  useAdapterEndpoint,
  DropdownSelector,
  TitleCard,
} from "odin-react";
import "odin-react/dist/index.css";
import "./styles.css";
import Container from "react-bootstrap/Container";
import Dropdown from "react-bootstrap/Dropdown";
import PixelGrid from "./PixelGrid";
import PowerDisplay from "./PowerSupplies";
import { getNested, format_json } from "./helperFunctions";
import { EditableClockGraph, ClockGraphs } from "./ClockDisplays";
import {
  DebugRegisterHeatmap,
  BitAmountInput,
  BitDepthInput,
  TriggerReadButton,
} from "./DebugRegister";
import {
  ConfigDisplay,
  ReadoutConfigDisplay,
  ApplyResetConfigButtons,
  DACReadouts,
  ResetDACs,
  resetSRConfig,
  resetDACsToValues,
  resetReadoutConfig,
} from "./Configuration";
import { Toggles, SaveLoadBar } from "./GPIODirect";
import { Toggle } from "./Toggle";
import Navbar from "./Navbar";
import { Routes, Route } from "react-router-dom";

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
  "zinq_ufrc_debug_sr_dout",
  "zinq_phi3_0",
];

function ClockConfigSelect(props) {
  const [clockGenSetting, setClockGenSetting] = useState("Loading");
  if (
    Object.keys(props.periodicEndpoint.data).length > 0 &&
    clockGenSetting == "Loading"
  ) {
    setClockGenSetting(props.periodicEndpoint.data.clkgen.config_file);
    if (!clockGenSetting) {
      setClockGenSetting("None");
    }
  }

  function applySetting(event) {
    setClockGenSetting(event);
    var valueToSend = event;
    if (valueToSend == "None") {
      valueToSend = null;
    }
    props.periodicEndpoint
      .put({ ["config_file"]: valueToSend }, "clkgen")
      .then((response) => {
        props.periodicEndpoint.mergeData(response, "clkgen");
      })
      .catch((err) => {
        console.error(err);
      });
  }

  if (Object.keys(props.periodicEndpoint.data).length > 0) {
    return (
      <TitleCard title="Clock Generator Settings">
        <p style={{ display: "inline-block" }}>Clock Generator Config File:</p>{" "}
        &nbsp;
        <div style={{ display: "inline-block" }}>
          <DropdownSelector
            buttonText={clockGenSetting || "None"}
            onSelect={applySetting}
          >
            {props.periodicEndpoint.data.clkgen.config_files_avail.map(
              (selection, index) => (
                <Dropdown.Item
                  eventKey={selection}
                  key={index}
                  active={selection == clockGenSetting}
                >
                  {selection}
                </Dropdown.Item>
              )
            )}
          </DropdownSelector>
        </div>
      </TitleCard>
    );
  } else {
    return <></>;
  }
}

function BitToggles(props) {
  var path = ["application", "gpio_direct"];
  var toggles = [];
  for (let key of Object.keys(getNested(props.periodicEndpoint.data, path))) {
    if (
      Object.keys(getNested(props.periodicEndpoint.data, path)[key]).includes(
        "mux_source_fw"
      ) &&
      !debugInputList.includes(key)
    ) {
      toggles.push(
        <Toggle
          endpoint={props.periodicEndpoint}
          path={[...path, key]}
          accessor={"mux_source_fw"}
          label={key + " FW controlled?"}
        />
      );
    }
  }
  return toggles;
}

function Main(props) {
  return (
    <div className="odin-server">
      <TitleCard
        title={
          <>
            <p style={{ float: "left" }}>Controls</p>
          </>
        }
      >
        <PowerDisplay periodicEndpointPower={props.periodicEndpointPower} />
        <br />
        <ClockConfigSelect periodicEndpoint={props.periodicEndpoint} />
      </TitleCard>
      <br />
    </div>
  );
}

function GPIO_Direct(props) {
  return (
    <div className="odin-server">
      <TitleCard
        title={
          <>
            <p style={{ float: "left" }}>Controls</p>
            <SaveLoadBar endpoint={props.periodicEndpoint} />
          </>
        }
      >
        <div className="wrap-and-compress">
          {Object.keys(props.periodicEndpoint.data).length > 0 ? (
            <Toggles
              periodicEndpoint={props.periodicEndpoint}
              isOutput={true}
              debugInputList={debugInputList}
            />
          ) : (
            <>
              <p style={{ color: "red" }}>
                Error - no data received from garud detector adapter
              </p>
            </>
          )}
        </div>
      </TitleCard>
      <br />
      <TitleCard title="Debug inputs">
        <div className="overlay" />
        <div className="wrap-and-compress">
          {Object.keys(props.periodicEndpoint.data).length > 0 ? (
            <Toggles
              periodicEndpoint={props.periodicEndpoint}
              isOutput={false}
              debugInputList={debugInputList}
            />
          ) : (
            <>
              <p style={{ color: "red" }}>
                Error - no data received from garud detector adapter
              </p>
            </>
          )}
        </div>
      </TitleCard>
      <br />
    </div>
  );
}

function Configuration(props) {
  return (
    <div className="odin-server">
      <TitleCard
        title={
          <>
            <p style={{ float: "left" }}>DACs</p>{" "}
            <ApplyResetConfigButtons
              periodicEndpoint={props.periodicEndpoint}
              func_to_run={resetDACsToValues}
              type={"dacs"}
            />
            <input
              onClick={() => ResetDACs(props.periodicEndpoint)}
              style={{ float: "right", marginRight: "5px" }}
              className="nice-button"
              type="button"
              value="Reset to defaults"
            />
          </>
        }
      >
        <div>
          {Object.keys(props.periodicEndpoint.data).length > 0 ? (
            <DACReadouts periodicEndpoint={props.periodicEndpoint} />
          ) : (
            <>
              <p style={{ color: "red" }}>
                Error - no data received from garud detector adapter
              </p>
            </>
          )}
        </div>
      </TitleCard>
      <br />
      <TitleCard
        title={
          <>
            <p style={{ float: "left" }}>Configuration Shift-Register</p>
            <ApplyResetConfigButtons
              periodicEndpoint={props.periodicEndpoint}
              func_to_run={resetSRConfig}
              type={"configbits"}
            />
          </>
        }
      >
        <div>
          {Object.keys(props.periodicEndpoint.data).length > 0 ? (
            <ConfigDisplay periodicEndpoint={props.periodicEndpoint} />
          ) : (
            <>
              <p style={{ color: "red" }}>
                Error - no data received from garud detector adapter
              </p>
            </>
          )}
        </div>
      </TitleCard>
      <br />
      <TitleCard
        title={
          <>
            <p style={{ float: "left" }}>Readout Config</p>
            <ApplyResetConfigButtons
              periodicEndpoint={props.periodicEndpoint}
              func_to_run={resetReadoutConfig}
              type={"readoutconfig"}
            />
          </>
        }
      >
        <div>
          {Object.keys(props.periodicEndpoint.data).length > 0 ? (
            <ReadoutConfigDisplay periodicEndpoint={props.periodicEndpoint} />
          ) : (
            <>
              <p style={{ color: "red" }}>
                Error - no data received from garud detector adapter
              </p>
            </>
          )}
        </div>
      </TitleCard>
      <br />
    </div>
  );
}

function JSON_Display(props) {
  return (
    <div className="odin-server">
      <TitleCard title={props.title}>
        <pre
          dangerouslySetInnerHTML={{
            __html: format_json(
              JSON.stringify(props.periodicEndpoint.data, null, "    "),
              1
            ),
          }}
        ></pre>
      </TitleCard>
      <br />
    </div>
  );
}

function Debug_Register(props) {
  return (
    <div className="odin-server">
      {Object.keys(props.periodicEndpoint.data).length > 0 ? (
        <>
          <TitleCard title="Menu">
            <div style={{ width: "49%", float: "left" }}>
              <TitleCard title="Trigger Reads">
                <TriggerReadButton
                  endpoint={props.periodicEndpoint}
                  key={"trigger_single_read"}
                  name={"Single Read"}
                />
                <div style={{ width: "100%", height: "20px" }}></div>
                <TriggerReadButton
                  endpoint={props.periodicEndpoint}
                  key={"trigger_adc_read"}
                  name={"ADC Read"}
                />
              </TitleCard>
            </div>
            <div style={{ width: "49%", float: "right" }}>
              <TitleCard title="Read settings">
                <BitAmountInput endpoint={props.periodicEndpoint} />
                <div style={{ width: "100%", height: "20px" }}></div>
                <BitDepthInput endpoint={props.periodicEndpoint} />
              </TitleCard>
            </div>
          </TitleCard>
          <br />
          <PixelGrid
            title="Debug Register Input"
            endpoint={props.periodicEndpoint}
            gridSize={8192}
            gridWidth={128}
            colours={["#000", "#fff"]}
          />
          <br />
          <TitleCard title="Debug Register Output">
            {Object.keys(props.periodicEndpoint.data).length > 0 ? (
              <DebugRegisterHeatmap periodicEndpoint={props.periodicEndpoint} />
            ) : (
              <>
                <p style={{ color: "red" }}>
                  Error - no data received from garud detector adapter
                </p>
              </>
            )}
          </TitleCard>
          <br />
        </>
      ) : (
        <>
          <p style={{ color: "red" }}>
            Error - no data received from garud detector adapter
          </p>
        </>
      )}
    </div>
  );
}

function Sensor_Stimulus(props) {
  return (
    <div className="odin-server">
      <div
        style={{
          width: "100%",
        }}
      >
        <TitleCard title="FW/SW Sensor Stimulus">
          <div className="wrap-and-compress">
            {Object.keys(props.periodicEndpoint.data).length > 0 ? (
              <BitToggles
                periodicEndpoint={props.periodicEndpoint}
                debugInputList={debugInputList}
              />
            ) : (
              <>
                <p style={{ color: "red" }}>
                  Error - no data received from garud detector adapter
                </p>
              </>
            )}
          </div>
        </TitleCard>
      </div>
    </div>
  );
}

function Pulse_Generator(props) {
  return (
    <div className="odin-server">
      <ClockGraphs
        periodicEndpoint={props.periodicEndpoint}
        maxSignalRange={props.maxSignalRange}
        path={props.path}
      />
      <br />
      <EditableClockGraph
        periodicEndpoint={props.periodicEndpoint}
        maxSignalRange={props.maxSignalRange}
        path={props.path}
      />
      <br />
    </div>
  );
}

export default function App() {
  //create the endpoint to use to contact the adapter, at the address specified in the .env file,
  //polling it to get the most recent parameter tree every 500 milliseconds

  const periodicEndpoint = useAdapterEndpoint(
    "detector",
    process.env.REACT_APP_ENDPOINT_URL,
    1000
  );
  const periodicEndpointPower = useAdapterEndpoint(
    "proxy",
    process.env.REACT_APP_ENDPOINT_URL,
    1000
  );

  return (
    <>
      <Navbar />
      <div style={{ padding: "20px" }}>
        <Routes>
          <Route
            path="/"
            element={
              <Main
                periodicEndpointPower={periodicEndpointPower}
                periodicEndpoint={periodicEndpoint}
              />
            }
          ></Route>
          <Route
            path="/gpio_direct"
            element={<GPIO_Direct periodicEndpoint={periodicEndpoint} />}
          ></Route>
          <Route
            path="/configuration"
            element={<Configuration periodicEndpoint={periodicEndpoint} />}
          ></Route>
          <Route
            path="/debug_register"
            element={<Debug_Register periodicEndpoint={periodicEndpoint} />}
          ></Route>
          <Route
            path="/sensor_stimulus"
            element={<Sensor_Stimulus periodicEndpoint={periodicEndpoint} />}
          ></Route>
          <Route
            path="/pulse_generator_1"
            element={
              <Pulse_Generator
                periodicEndpoint={periodicEndpoint}
                path={[
                  "application",
                  "pulse_generators",
                  "pulse_generator_0",
                  "channels",
                ]}
              />
            }
          ></Route>
          <Route
            path="/pulse_generator_2"
            element={
              <Pulse_Generator
                periodicEndpoint={periodicEndpoint}
                path={[
                  "application",
                  "pulse_generators",
                  "pulse_generator_1",
                  "channels",
                ]}
              />
            }
          ></Route>
          <Route
            path="/detector_json"
            element={
              <JSON_Display
                title={"Detector JSON Data"}
                periodicEndpoint={periodicEndpoint}
              />
            }
          ></Route>
          <Route
            path="/power_supply_json"
            element={
              <JSON_Display
                title={"Power Supply JSON Data"}
                periodicEndpoint={periodicEndpointPower}
              />
            }
          ></Route>
        </Routes>
      </div>
    </>
  );
  return (
    <OdinApp
      title="GARUD"
      navLinks={[
        "Main",
        "GPIO Direct",
        "Configuration",
        "Debug Register Test",
        "FW/SW Sensor Stimulus",
        "Pulse Generator 1",
        "Pulse Generator 2",
        "Detector JSON",
        "Power Supply JSON",
      ]}
      icon_src="odin.png"
    >
      <Container>
        <Main
          periodicEndpointPower={periodicEndpointPower}
          periodicEndpoint={periodicEndpoint}
        />
      </Container>
      <Container>
        <GPIO_Direct periodicEndpoint={periodicEndpoint} />
      </Container>
      <Container>
        <Configuration periodicEndpoint={periodicEndpoint} />
      </Container>
      <Container>
        <Debug_Register periodicEndpoint={periodicEndpoint} />
      </Container>
      <Container>
        <Sensor_Stimulus periodicEndpoint={periodicEndpoint} />
      </Container>
      <Container>
        <Pulse_Generator
          periodicEndpoint={periodicEndpoint}
          maxSignalRange={maxSignalRange}
          path={[
            "application",
            "pulse_generators",
            "pulse_generator_0",
            "channels",
          ]}
        />
      </Container>
      <Container>
        <Pulse_Generator
          periodicEndpoint={periodicEndpoint}
          maxSignalRange={maxSignalRange}
          path={[
            "application",
            "pulse_generators",
            "pulse_generator_1",
            "channels",
          ]}
        />
      </Container>
      <Container>
        <JSON_Display
          title={"Detector JSON Data"}
          periodicEndpoint={periodicEndpoint}
        />
      </Container>
      <Container>
        <JSON_Display
          title={"Power Supply JSON Data"}
          periodicEndpoint={periodicEndpointPower}
        />
      </Container>
    </OdinApp>
  );
}
