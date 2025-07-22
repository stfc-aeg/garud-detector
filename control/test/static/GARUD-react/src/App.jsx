import { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { OdinApp, useAdapterEndpoint, TitleCard } from "odin-react";
//import "odin-react/dist/index.css";
import "./styles.css";
import Container from "react-bootstrap/Container";
import { DropdownButton, Dropdown } from "react-bootstrap";
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
    if (
      Object.keys(props.periodicEndpoint.data).length > 0 &&
      clockGenSetting == "Loading"
    ) {
      setClockGenSetting(props.periodicEndpoint.data.clkgen.config_file);
      if (!clockGenSetting) {
        setClockGenSetting("None");
      }
    }
    return (
      <TitleCard title="Clock Generator Settings">
        <p style={{ display: "inline-block" }}>Clock Generator Config File:</p>{" "}
        &nbsp;
        <div style={{ display: "inline-block" }}>
          <DropdownButton
            title={clockGenSetting || "None"}
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
          </DropdownButton>
        </div>
      </TitleCard>
    );
  } else {
    return (
      <TitleCard title="Clock Generator Settings">
        <p style={{ color: "red" }}>
          Error - no data received from garud detector adapter
        </p>
      </TitleCard>
    );
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
          key={key}
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
          <TitleCard title="Menu">
            <p style={{ color: "red" }}>
              Error - no data received from garud detector adapter
            </p>
          </TitleCard>
          <br />
          <TitleCard title="Debug Register Input">
            <p style={{ color: "red" }}>
              Error - no data received from garud detector adapter
            </p>
          </TitleCard>
          <br />
          <TitleCard title="Debug Register Output">
            <p style={{ color: "red" }}>
              Error - no data received from garud detector adapter
            </p>
          </TitleCard>
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
              <p style={{ color: "red" }}>
                Error - no data received from garud detector adapter
              </p>
            )}
          </div>
        </TitleCard>
      </div>
    </div>
  );
}

function Pulse_Generator(props) {
  const [index, setIndex] = useState(0);
  return (
    <div className="odin-server">
      <ClockGraphs
        periodicEndpoint={props.periodicEndpoint}
        maxSignalRange={props.maxSignalRange}
        path={props.path}
        setIndex={setIndex}
      />
      <br />
      <EditableClockGraph
        number={props.number}
        periodicEndpoint={props.periodicEndpoint}
        maxSignalRange={props.maxSignalRange}
        path={props.path}
        index={index}
        setIndex={setIndex}
      />
      <br />
    </div>
  );
}

function getPulseGeneratorPages(periodicEndpoint) {
  if (Object.keys(periodicEndpoint.data).length > 0) {
    var pages = [];
    for (
      let i = 0;
      i <
      Object.keys(periodicEndpoint.data.application.pulse_generators).length;
      i++
    ) {
      pages.push(
        <Container key={i}>
          <Pulse_Generator
            number={i}
            periodicEndpoint={periodicEndpoint}
            path={[
              "application",
              "pulse_generators",
              "pulse_generator_" + String(i),
              "channels",
            ]}
          />
        </Container>
      );
    }
    return pages;
  } else {
    return <></>;
  }
}

function getPulseGeneratorPageNames(periodicEndpoint) {
  if (Object.keys(periodicEndpoint.data).length > 0) {
    var pageNames = [];
    for (
      let i = 0;
      i <
      Object.keys(periodicEndpoint.data.application.pulse_generators).length;
      i++
    ) {
      pageNames.push("pulse_generator_" + String(i));
    }
    return pageNames;
  } else {
    return [];
  }
}

export default function App() {
  //create the endpoint to use to contact the adapter, at the address specified in the .env file,
  //polling it to get the most recent parameter tree every 500 milliseconds
  const periodicEndpoint = useAdapterEndpoint(
    "detector",
    "http://192.168.0.191:8888",
    1000
  );
  const periodicEndpointPower = useAdapterEndpoint(
    "proxy",
    "http://192.168.0.191:8888",
    1000
  );

  return (
    <>
      <OdinApp
        title="GARUD"
        navLinks={[
          "Main",
          "GPIO Direct",
          "Config",
          "Debug Register",
          "Sensor Stimulus",
          { "Pulse Generators": getPulseGeneratorPageNames(periodicEndpoint) },
          "Detector JSON",
          "Power Supply JSON",
        ]}
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
        {getPulseGeneratorPages(periodicEndpoint)}
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
    </>
  );
}
