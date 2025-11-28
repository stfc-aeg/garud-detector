import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
//import "odin-react/dist/index.css";
import "./styles.css";
import Plot from "react-plotly.js";
import PixelGrid from "./PixelGrid";
import { TitleCard } from "odin-react";
import Button from 'react-bootstrap/Button'
import Spinner from 'react-bootstrap/Spinner'

// a plotly component, to create a heatmap in black and white. The use of memo makes it only rerender when the isEqual function is false
const Heatmap = React.memo((props) => {
  return (
    <Plot
      data={[
        {
          showlegend: false,
          showscale: false,
          z: props.z_data,
          type: "heatmap",
          colorscale: "Greys",
        },
      ]}
      config={{
        responsive: true,
      }}
      layout={{
        width:
          window.innerWidth * 0.96 -
          6.5 * parseFloat(getComputedStyle(document.documentElement).fontSize),
        height:
          window.innerWidth * 0.48 -
          3.25 *
            parseFloat(getComputedStyle(document.documentElement).fontSize),
        margin: {
          l: 10,
          r: 10,
          t: 10,
          b: 10,
        },
        title: {
          text: " ",
        },
        xaxis: {
          visible: false,
          fixedrange: true,
        },
        yaxis: {
          visible: false,
          fixedrange: true,
        },
      }}
    />
  );
}, isEqual);

// A function to evaluate if two arrays of data are the same, by converting them to strings and comparing them
function isEqual(oldProps, newProps) {
  return (
    Array.from(oldProps.z_data).flat().join(",") ===
    Array.from(newProps.z_data).flat().join(",")
  );
}

//convert the array of data we are given into a 2d array, then create a heatmap using the plotly library (component defined separately) using that data
function DebugRegisterHeatmap(props) {
  var z_data = [];
  for (let x = 0; x < 64; x++) {
    var temp = [];
    for (let y = 0; y < 128; y++) {
      temp.push(0);
      //temp.push([0, 1][Math.floor(Math.random() * 2)]);
    }
    z_data.push(temp);
  }
  for (
    let i = 0;
    i < props.periodicEndpoint.data.application.debugreg.pixel_data.length;
    i++
  ) {
    z_data[63 - Math.floor(i / 128)][i % 128] =
      props.periodicEndpoint.data.application.debugreg.pixel_data[i];
  }
  return <Heatmap z_data={z_data} />;
}

function TriggerReadButton(props) {
  var executing = props.endpoint.data.application.debugreg.trigger_adc_read ||props.endpoint.data.application.debugreg.trigger_single_read;
  function Send(event) {
    //set the flag in the parameter tree to true to trigger a read
    props.endpoint
      .put({ [props.trigger_key]: true }, "application/debugreg")
      .then((response) => {
        props.endpoint.mergeData(response, "application/debugreg");
      })
      .catch((err) => {
        console.error(err);
      });
  }
  return (
    ///<input
    ///  style={{ width: "100%" }}
    ///  onClick={Send}
    ///  className="nice-button"
    ///  type="button"
    ///  value={props.name}
    ///  disabled={executing}
    ////>
    <Button
      onClick={Send}
      disabled={executing}
    >
      {props.name}
      {(executing) && <Spinner animation="border" size="sm" />}
    </Button>
  );
}

function BitAmountInput(props) {
  function Send(event, endpoint) {
    var valueToSend = 8192;
    if (event.target.value != "") {
      event.target.value = Math.min(event.target.value, 8192);
      event.target.value = Math.max(event.target.value, 1);
      valueToSend = Number(event.target.value);
    }
    endpoint
      .put({ ["readout_length"]: valueToSend }, "application/debugreg")
      .then((response) => {
        endpoint.mergeData(response, "application/debugreg");
      })
      .catch((err) => {
        console.error(err);
      });
  }
  return (
    <>
      <div style={{ width: "100%" }}>
        <p style={{ width: "270px", display: "inline-block" }}>
          Number of bits to read (1-8192):
        </p>
        <input
          onChange={(event) => Send(event, props.endpoint)}
          className="BitLengthInput"
          type="number"
          defaultValue={
            props.endpoint.data["application"]["debugreg"]["readout_length"]
          }
        />
      </div>
    </>
  );
}

function BitDepthInput(props) {
  function Send(event, endpoint) {
    endpoint
      .put(
        { ["readout_depth"]: Number(event.target.value) },
        "application/debugreg"
      )
      .then((response) => {
        endpoint.mergeData(response, "application/debugreg");
      })
      .catch((err) => {
        console.error(err);
      });
  }
  return (
    <>
      <div style={{ width: "100%" }}>
        <p style={{ width: "240px", display: "inline-block" }}>
          Depth of bits to read (1-13):
        </p>
        <input
          onChange={(event) => Send(event, props.endpoint)}
          className="BitDepthInput"
          type="range"
          min="1"
          max="13"
          value={props.endpoint.data.application.debugreg.readout_depth}
        />
        <p
          style={{ width: "30px", marginLeft: "10px", display: "inline-block" }}
        >
          {props.endpoint.data.application.debugreg.readout_depth}
        </p>
      </div>
    </>
  );
}

export default function Debug_Register(props) {
  return (
    <div className="odin-server">
      {Object.keys(props.periodicEndpoint.data).length > 0 ? (
        <>
          <TitleCard title="Menu">
            <div style={{ width: "49%", float: "left" }}>
              <TitleCard title="Trigger Reads">
                <div className="mytooltip">
                  <TriggerReadButton
                    endpoint={props.periodicEndpoint}
                    trigger_key={"trigger_single_read"}
                    name={"Single Read"}
                    disabled={true}
                  />
                  {
                    <span className="mytooltiptext">
                      {"Function: debugreg_load_serialiser_test_pattern"}
                    </span>
                  }
                </div>
                <div style={{ width: "100%", height: "20px" }}></div>
                <div className="mytooltip">
                  <TriggerReadButton
                    endpoint={props.periodicEndpoint}
                    trigger_key={"trigger_adc_read"}
                    name={"ADC Read"}
                  />
                  {
                    <span className="mytooltiptext">
                      {"Function: debugreg_readout_adc"}
                    </span>
                  }
                </div>
              </TitleCard>
            </div>
            <div style={{ width: "49%", float: "right" }}>
              <TitleCard title="Read settings">
                <div className="mytooltip">
                  <BitAmountInput endpoint={props.periodicEndpoint} />
                  {
                    <span className="mytooltiptext">
                      {"Function: _debugreg_set_depth"}
                    </span>
                  }
                </div>
                <div style={{ width: "100%", height: "20px" }}></div>
                <div className="mytooltip">
                  <BitDepthInput endpoint={props.periodicEndpoint} />
                  {
                    <span className="mytooltiptext">
                      {"Function: _debugreg_adc_set_bit_depth"}
                    </span>
                  }
                </div>
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
