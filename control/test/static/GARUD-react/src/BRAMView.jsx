import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
//import "odin-react/dist/index.css";
import "./styles.css";
import Plot from "react-plotly.js";
import { TitleCard } from "odin-react";

function DisplayFrameStartInput(props) {
  function Send(event, endpoint) {
    endpoint
      .put(
        { ["display_start_frame"]: Number(event.target.value) },
        "application/bram/control"
      )
      .then((response) => {
        endpoint.mergeData(response, "application/bram/control");
      })
      .catch((err) => {
        console.error(err);
      });
  }
  return (
    <>
      <div style={{ width: "100%" }}>
        <p style={{ width: "240px", display: "inline-block" }}>
          Starting frame (up to {props.periodicEndpoint.data.application.bram.control.max_frame}):
        </p>
        <input
          onChange={(event) => Send(event, props.periodicEndpoint)}
          className="DisplayFrameStartInput"
          type="range"
          min="0"
          max={props.periodicEndpoint.data.application.bram.control.max_frame}
        />
        <p
          style={{ width: "30px", marginLeft: "10px", display: "inline-block" }}
        >
          {props.periodicEndpoint.data.application.bram.control.display_start_frame}
        </p>
      </div>
    </>
  );
}

function DisplayFrameNumInput(props) {
  function Send(event, endpoint) {
    endpoint
      .put(
        { ["display_num_frames"]: Number(event.target.value) },
        "application/bram/control"
      )
      .then((response) => {
        endpoint.mergeData(response, "application/bram/control");
      })
      .catch((err) => {
        console.error(err);
      });
  }
  return (
    <>
      <div style={{ width: "100%" }}>
        <p style={{ width: "240px", display: "inline-block" }}>
          Number of frames to display:
        </p>
        <input
          onChange={(event) => Send(event, props.periodicEndpoint)}
          className="DisplayFrameNumInput"
          type="range"
          min="1"
          max={props.periodicEndpoint.data.application.bram.control.max_frame - props.periodicEndpoint.data.application.bram.control.display_start_frame}
        />
        <p
          style={{ width: "30px", marginLeft: "10px", display: "inline-block" }}
        >
          {props.periodicEndpoint.data.application.bram.control.display_num_frames}
        </p>
      </div>
    </>
  );
}

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

function TriggerReadButton(props) {
  function Send() {
    //set the flag in the parameter tree to true to trigger a read
    props.endpoint
      .put({ ["refresh"]: true }, "application/bram/control")
      .then((response) => {
        props.endpoint.mergeData(response, "application/bram/control");
      })
      .catch((err) => {
        console.error(err);
      });
  }
  return (
    <input
      style={{ width: "100%" }}
      onClick={Send}
      className="nice-button"
      type="button"
      value={props.name}
    />
  );
}

//convert the array of data we are given into a 2d array, then create a heatmap using the plotly library (component defined separately) using that data
function BRAMFrameHeatmap(props) {
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
    i < props.periodicEndpoint.data.application.bram.data[props.frame_number].length;
    i++
  ) {
    z_data[63 - Math.floor(i / 128)][i % 128] =
      props.periodicEndpoint.data.application.bram.data[props.frame_number][i];
  }
  return <Heatmap z_data={z_data} />;
}
function BRAMFrames(props) {
    var framerows = [];
    for (let frame_number of Object.keys(props.periodicEndpoint.data.application.bram.data)) {
        var title = props.periodicEndpoint.data.application.bram.control.display_combined ? "BRAM Combined frames  " + props.periodicEndpoint.data.application.bram.control.display_start_frame + " - " + props.periodicEndpoint.data.application.bram.control.display_num_frames : "BRAM Output frame " + frame_number;
        framerows.push(
          <TitleCard title={title}>
            {props.periodicEndpoint.data.application.bram.data[frame_number] != null ? (
              <BRAMFrameHeatmap periodicEndpoint={props.periodicEndpoint} frame_number={frame_number} />
            ) : (
              <>
                <p style={{ color: "red" }}>
                  Error - no data received from garud detector adapter
                </p>
              </>
            )}
          </TitleCard>
        );
    }
    return framerows;
}

export default function BRAM_View(props) {
  return (
    <div className="odin-server">
      {Object.keys(props.periodicEndpoint.data).length > 0 ? (
        <>
          <TitleCard title="Trigger">
            <div style={{ width: "49%", float: "left" }}>
              <TitleCard title="Trigger Reads">
                <div className="mytooltip">
                  <TriggerReadButton
                    endpoint={props.periodicEndpoint}
                    name={"Refresh"}
                  />
                  {
                    <span className="mytooltiptext">
                      {"Function: _bram_refresh"}
                    </span>
                  }
                </div>
                <div style={{ width: "100%", height: "20px" }}></div>
              </TitleCard>
            </div>
            <div style={{ width: "49%", float: "right" }}>
              <TitleCard title="Read settings">
                <div className="mytooltip">
                  <DisplayFrameStartInput periodicEndpoint={props.periodicEndpoint} />
                  {
                    <span className="mytooltiptext">
                      {"Function: UPDATEME"}
                    </span>
                  }
                </div>
                <div style={{ width: "100%", height: "20px" }}></div>
                <div className="mytooltip">
                  <DisplayFrameNumInput periodicEndpoint={props.periodicEndpoint} />
                  {
                    <span className="mytooltiptext">
                      {"Function: UPDATEME"}
                    </span>
                  }
                </div>
              </TitleCard>
            </div>
          </TitleCard>
          <br />
          <BRAMFrames periodicEndpoint={props.periodicEndpoint} />
          <br />
        </>
      ) : (
        <></>
      )}
    </div>
  );
}
