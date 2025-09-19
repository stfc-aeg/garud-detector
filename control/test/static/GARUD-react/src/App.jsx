import "bootstrap/dist/css/bootstrap.min.css";
import { OdinApp, useAdapterEndpoint } from "odin-react";
//import "odin-react/dist/index.css";
import "./styles.css";
import Container from "react-bootstrap/Container";
import { JSON_Display } from "./HelperFunctions";
import Main from "./MainPage";
import GPIO_Direct from "./GPIODirect";
import Configuration from "./Configuration";
import Debug_Register from "./DebugRegister";
import BRAM_View from "./BRAMView";
import Sensor_Stimulus from "./SensorStimulus";
import {
  getPulseGeneratorPageNames,
  getPulseGeneratorPages,
} from "./PulseGenerator";

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
          "BRAM View",
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
          <GPIO_Direct
            periodicEndpoint={periodicEndpoint}
            debugInputList={debugInputList}
          />
        </Container>
        <Container>
          <Configuration periodicEndpoint={periodicEndpoint} />
        </Container>
        <Container>
          <Debug_Register periodicEndpoint={periodicEndpoint} />
        </Container>
        <Container>
          <Sensor_Stimulus
            periodicEndpoint={periodicEndpoint}
            debugInputList={debugInputList}
          />
        </Container>
        {getPulseGeneratorPages(periodicEndpoint)}
        <Container>
          <BRAM_View periodicEndpoint={periodicEndpoint} />
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
    </>
  );
}
