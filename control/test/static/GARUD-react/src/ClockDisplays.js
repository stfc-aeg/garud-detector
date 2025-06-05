import { useState, useEffect, createRef, useRef } from "react";
import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import Plot from "react-plotly.js";
import { DropdownSelector, TitleCard } from "odin-react";
import Dropdown from "react-bootstrap/Dropdown";
import { getNested } from "./helperFunctions";

function ToggleButton(props) {
  function updateValue() {
    props.periodicEndpoint
      .put(
        {
          ["enable"]: !getNested(
            props.periodicEndpoint.data,
            props.path.slice(0, props.path.length - 1)
          )["enable"],
        },
        props.path.slice(0, props.path.length - 1).join("/")
      )
      .then((response) => {
        props.periodicEndpoint.mergeData(
          response,
          props.path.slice(0, props.path.length - 1).join("/")
        );
      })
      .catch((err) => {
        console.error(err);
      });
  }
  var color = "#80F080";
  var text = "Start";
  if (
    Boolean(
      getNested(
        props.periodicEndpoint.data,
        props.path.slice(0, props.path.length - 1)
      )["enable"]
    )
  ) {
    color = "#FF8080";
    text = "Reset";
  }
  return (
    <input
      style={{
        backgroundColor: color,
        color: "white",
        borderColor: color,
        borderStyle: "solid",
        borderRadius: "5px",
      }}
      type="Button"
      readOnly
      onClick={updateValue}
      value={text}
    />
  );
}

function TextEntries(props) {
  var textEntries = [];
  for (let i = 0; i < props.tps.length; i++) {
    textEntries.push(
      <p key={i} style={{ display: "inline-block", width: "18%" }}>
        Transition point {i + 1}:
        <br />
        <input
          type="number"
          ref={props.tprefs[i]}
          value={
            props.tprefs[i].current === document.activeElement
              ? props.tprefs[i].value
              : props.tps[i].x0
          }
          onKeyDown={(event) => props.alterLineValue(String(i + 2), event)}
          //onChange={(event) => moveLines("0", Number(event.target.value))}
        />
      </p>
    );
  }
  return textEntries;
}

export function EditableClockGraph(props) {
  if (Object.keys(props.periodicEndpoint.data).length == 0) {
    return (
      <TitleCard
        title={
          <>
            <p style={{ marginBottom: "0px", float: "left" }}>
              Edit Chip Stimulus Bit Settings
            </p>
          </>
        }
      >
        <p style={{ color: "red" }}>
          Error - no data received from garud detector adapter
        </p>
      </TitleCard>
    );
  }

  const lpref = useRef();
  var periodicEndpoint = props.periodicEndpoint;
  var maxSignalRange = getNested(
    periodicEndpoint.data,
    props.path.slice(0, props.path.length - 1)
  )["counter_max"];
  const [index, setIndex] = useState(0);
  const [mp, setMp] = useState({
    x0: 0,
    y0: -100,
    x1: 0,
    y1: 100,
    line: {
      color: "black",
      width: 3,
    },
  });
  const [wave, setWave] = useState({
    x: 0,
    y: 0,
    type: "scatter",
    mode: "lines",
    marker: {
      color: "green",
      width: 0,
    },
    hoverinfo: "none",
  });

  var lp = {
    x0: getNested(periodicEndpoint.data, props.path)[String(index)][
      "loop_point"
    ],
    y0: -100,
    x1: getNested(periodicEndpoint.data, props.path)[String(index)][
      "loop_point"
    ],
    y1: 100,
    line: {
      color: "red",
      width: 3,
    },
  };

  var tps = [];
  var tprefs = [];
  for (
    let i = 0;
    i <
    Object.keys(
      getNested(periodicEndpoint.data, props.path)[String(index)]["transitions"]
    ).length;
    i++
  ) {
    tps.push({
      x0: getNested(periodicEndpoint.data, props.path)[String(index)][
        "transitions"
      ][String(i)],
      y0: -100,
      x1: getNested(periodicEndpoint.data, props.path)[String(index)][
        "transitions"
      ][String(i)],
      y1: 100,
      line: {
        color: "green",
        width: 3,
      },
    });
    tprefs.push(useRef());
  }

  const [signalRange, setSignalRange] = useState([
    0,
    Math.min(Math.max(lp.x0 * 1.1, lp.x0 + 1, 2), maxSignalRange),
  ]);

  useEffect(() => {
    calculateWaveShape("5", 0);
  }, [JSON.stringify(tps), lp.x0]);

  function calculateWaveShape(shapeIndex, value, startingLow = true) {
    var xValues = [];

    for (let i = 0; i < tps.length; i++) {
      xValues.push(Math.round(tps[i].x0));
    }

    if (Number(shapeIndex) <= 3) xValues[Number(shapeIndex)] = value;
    var lpx0copy = lp.x0;
    if (Number(shapeIndex) == 4) lpx0copy = value;
    xValues.sort(function (a, b) {
      return a - b;
    });
    for (let i = 0; i < xValues.length; i++) {
      if (xValues[i] > Math.round(lpx0copy)) {
        xValues = xValues.slice(0, i);
        break;
      }
    }
    var low = Boolean(
      getNested(
        props.periodicEndpoint.data,
        props.path.slice(0, props.path.length - 1)
      )["preset"]
    );
    var x = [0];
    var y = [
      getNested(
        props.periodicEndpoint.data,
        props.path.slice(0, props.path.length - 1)
      )["preset"] == 0
        ? 0.001
        : 0.999,
    ];
    for (let i = 0; i < xValues.length; i++) {
      x.push(xValues[i]);
      x.push(xValues[i]);
      if (low) {
        y.push(0.999);
        y.push(0.001);
      } else {
        y.push(0.001);
        y.push(0.999);
      }
      low = !low;
    }
    x.push(Math.round(lpx0copy));
    if (low) {
      y.push(0.999);
    } else {
      y.push(0.001);
    }
    setWave({
      x: x,
      y: y,
      type: "scatter",
      mode: "lines",
      marker: {
        color: "green",
        width: 500000000,
      },
      hoverinfo: "none",
    });
  }

  function moveLines(shapeIndex, value) {
    if (Number(shapeIndex) > 1) {
      props.periodicEndpoint
        .put(
          { [shapeIndex - 2]: Math.round(Math.min(value, maxSignalRange)) },
          props.path.join("/") + "/" + index + "/transitions"
        )
        .then((response) => {
          props.periodicEndpoint.mergeData(
            response,
            props.path.join("/") + "/" + index + "/transitions"
          );
        })
        .catch((err) => {
          console.error(err);
        });
    } else if (shapeIndex == "0") {
      var newPosition = Math.max(
        Math.round(Math.min(value, maxSignalRange)),
        mp.x0 + 1
      );
      var range = newPosition - mp.x0;
      props.periodicEndpoint
        .put(
          { ["loop_point"]: newPosition },
          props.path.join("/") + "/" + index
        )
        .then((response) => {
          props.periodicEndpoint.mergeData(
            response,
            props.path.join("/") + "/" + index
          );
        })
        .catch((err) => {
          console.error(err);
        });
      setSignalRange([
        Math.max(mp.x0 - range * 0.1, 0),
        Math.min(Math.max(value + range * 0.1, value + 1, 2), maxSignalRange),
      ]);
      var needsMoving = [];
      for (let i = 0; i < tps.length; i++) {
        if (Math.round(tps[i].x0) > Math.round(lp.x0)) {
          needsMoving.push(String(i));
        }
      }
      for (let i = 0; i < needsMoving.length; i++) {
        var position =
          value + (value - mp.x0) * (0.08 / needsMoving.length) * (i + 1);
        props.periodicEndpoint
          .put(
            { [needsMoving[i]]: Math.ceil(Math.min(position, maxSignalRange)) },
            props.path.join("/") + "/" + index + "/transitions"
          )
          .then((response) => {
            props.periodicEndpoint.mergeData(
              response,
              props.path.join("/") + "/" + index + "/transitions"
            );
          })
          .catch((err) => {
            console.error(err);
          });
      }
    } else if (shapeIndex == "1") {
      var newPosition = Math.max(Math.round(Math.min(value, lp.x0 - 1)), 0);
      var range = lp.x0 - newPosition;
      setMp({
        x0: newPosition,
        y0: -100,
        x1: newPosition,
        y1: 100,
        line: {
          color: "black",
          width: 3,
        },
      });
      setSignalRange([
        Math.max(newPosition - range * 0.1, 0),
        Math.min(Math.max(lp.x0 + range * 0.1, lp.x0 + 1, 2), maxSignalRange),
      ]);

      var needsMoving = [];
      for (let i = 0; i < tps.length; i++) {
        if (Math.round(tps[i].x0) > Math.round(lp.x0)) {
          needsMoving.push(String(i));
        }
      }
      for (let i = 0; i < needsMoving.length; i++) {
        var position =
          lp.x0 + (lp.x0 - newPosition) * (0.08 / needsMoving.length) * (i + 1);
        props.periodicEndpoint
          .put(
            { [needsMoving[i]]: Math.ceil(Math.min(position, maxSignalRange)) },
            props.path.join("/") + "/" + index + "/transitions"
          )
          .then((response) => {
            props.periodicEndpoint.mergeData(
              response,
              props.path.join("/") + "/" + index + "/transitions"
            );
          })
          .catch((err) => {
            console.error(err);
          });
      }
    }
  }

  function onLineMovement(event) {
    if (!Object.keys(event)[0].includes("shapes")) {
      return;
    }
    var shapeIndex = Object.keys(event)[0].split("[")[1][0];
    moveLines(shapeIndex, event["shapes[" + shapeIndex + "].x0"]);
  }

  function resetRange() {
    props.periodicEndpoint
      .put(
        { ["loop_point"]: maxSignalRange },
        props.path.join("/") + "/" + index
      )
      .then((response) => {
        props.periodicEndpoint.mergeData(
          response,
          props.path.join("/") + "/" + index
        );
      })
      .catch((err) => {
        console.error(err);
      });

    setMp({
      x0: 0,
      y0: -100,
      x1: 0,
      y1: 100,
      line: {
        color: "black",
        width: 3,
      },
    });

    setSignalRange([0, maxSignalRange]);
    calculateWaveShape("4", maxSignalRange);
  }

  function alterLineValue(shapeIndex, event) {
    if (event.key == "Enter") {
      moveLines(shapeIndex, Number(event.target.value));
    }
  }

  return (
    <TitleCard
      title={
        <>
          <p style={{ marginBottom: "0px", float: "left" }}>
            Edit Chip Stimulus Bit Settings
          </p>
        </>
      }
    >
      <div style={{ marginBottom: "5px" }}>
        <div style={{ display: "inline-block" }}>
          <DropdownSelector
            buttonText={
              "Clock Stimulus Bit: " + String(index) ||
              "Clock Stimulus Bit: None"
            }
            onSelect={(event) => setIndex(event)}
          >
            {Object.keys(getNested(periodicEndpoint.data, props.path)).map(
              (selection, i) => (
                <Dropdown.Item
                  eventKey={String(selection)}
                  key={i}
                  active={String(selection) == String(index)}
                >
                  {String(selection)}
                </Dropdown.Item>
              )
            )}
          </DropdownSelector>
        </div>
        <Plot
          style={{ width: "100%", height: "150px" }}
          onRelayout={onLineMovement}
          data={[wave]}
          config={{
            editable: true,
            responsive: true,
          }}
          layout={{
            autosize: true,
            title: {
              text: "Clock settings for bit " + String(index),
              subtitle: {
                text: " ",
                font: {
                  size: 1,
                },
              },
            },
            margin: {
              l: 50,
              r: 50,
              t: 50,
              b: 20,
            },
            xaxis: {
              fixedrange: true,
              range: signalRange,
              exponentformat: "e",
              //tickformat: "X",
              title: {
                text: " ",
                font: {
                  size: 1,
                },
              },
            },
            yaxis: {
              fixedrange: true,
              visible: false,
              range: [0, 1],
            },
            shapes: [lp, mp, ...tps],
          }}
        />
        <TextEntries
          tprefs={tprefs}
          tps={tps}
          alterLineValue={alterLineValue}
        />
        <p style={{ display: "inline-block", width: "18%" }}>
          Loop point: <br />
          <input
            type="number"
            ref={lpref}
            value={
              lpref.current === document.activeElement ? lpref.value : lp.x0
            }
            onKeyDown={(event) => alterLineValue("4", event)}
            //onChange={(event) => moveLines("4", Number(event.target.value))}
          />
        </p>
        <input
          style={{ display: "inline-block", width: "10%" }}
          onClick={resetRange}
          className="nice-button"
          type="button"
          value="Reset Range"
          readOnly
        />
      </div>
    </TitleCard>
  );
}

function ReadonlyClockGraph(props) {
  var [periodicEndpoint, index] = [props.periodicEndpoint, props.index];
  var maxSignalRange = getNested(
    periodicEndpoint.data,
    props.path.slice(0, props.path.length - 1)
  )["counter_max"];
  const [displayClockRange, setDisplayClockRange] = useState([
    0,
    maxSignalRange,
  ]);
  const [wave, setWave] = useState([
    {
      x: 0,
      y: 0,
      type: "scatter",
      mode: "lines",
      marker: {
        color: "green",
        width: 0,
      },
      hoverinfo: "none",
    },
  ]);
  var tps = [];
  for (
    let i = 0;
    i <
    Object.keys(
      getNested(periodicEndpoint.data, props.path)[String(index)]["transitions"]
    ).length;
    i++
  ) {
    tps.push({
      x0: getNested(periodicEndpoint.data, props.path)[String(index)][
        "transitions"
      ][String(i)],
      y0: -100,
      x1: getNested(periodicEndpoint.data, props.path)[String(index)][
        "transitions"
      ][String(i)],
      y1: 100,
      line: {
        color: "green",
        width: 3,
      },
    });
  }
  var lp = {
    x0: getNested(periodicEndpoint.data, props.path)[String(index)][
      "loop_point"
    ],
    y0: -100,
    x1: getNested(periodicEndpoint.data, props.path)[String(index)][
      "loop_point"
    ],
    y1: 100,
    line: {
      color: "red",
      width: 3,
    },
  };
  var shapes = [
    ...tps,
    lp,
    {
      x0: 0,
      y0: -100,
      x1: 0,
      y1: 100,
      line: {
        color: "black",
        width: 3,
      },
    },
  ];

  useEffect(() => {
    calculateWaveShape();
  }, [JSON.stringify(tps), lp.x0]);

  function calculateWaveShape(startingLow = true) {
    var xValues = [];
    for (let i = 0; i < tps.length; i++) {
      xValues.push(Math.round(tps[i].x0));
    }
    var lpx0copy = lp.x0;
    xValues.sort(function (a, b) {
      return a - b;
    });
    for (let i = 0; i < xValues.length; i++) {
      if (xValues[i] > Math.round(lpx0copy)) {
        xValues = xValues.slice(0, i);
        break;
      }
    }
    var x = [0];
    var y = [
      getNested(
        props.periodicEndpoint.data,
        props.path.slice(0, props.path.length - 1)
      )["preset"] == 0
        ? 0.001
        : 0.999,
    ];
    var low = getNested(
      props.periodicEndpoint.data,
      props.path.slice(0, props.path.length - 1)
    )["preset"];
    for (let i = 0; i < xValues.length; i++) {
      x.push(xValues[i]);
      x.push(xValues[i]);
      if (low) {
        y.push(0.999);
        y.push(0.001);
      } else {
        y.push(0.001);
        y.push(0.999);
      }
      low = !low;
    }
    x.push(Math.round(lpx0copy));
    if (low) {
      y.push(0.999);
    } else {
      y.push(0.001);
    }
    setWave([
      {
        x: x,
        y: y,
        type: "scatter",
        mode: "lines",
        marker: {
          color: "green",
        },
        hoverinfo: "none",
      },
    ]);
  }

  function resize(event) {
    if ("xaxis.range" in event) {
      setDisplayClockRange(event["xaxis.range"]);
    } else if ("xaxis.range[0]" in event) {
      setDisplayClockRange([
        Math.max(event["xaxis.range[0]"], 0),
        Math.min(event["xaxis.range[1]"], maxSignalRange),
      ]);
    }
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
      }}
    >
      <div style={{ width: "17%" }}>{"Stimulus bit " + String(index)}</div>
      <div style={{ width: "82%" }}>
        <Plot
          style={{ height: "30px" }}
          onRelayout={resize}
          data={wave}
          config={{
            scrollZoom: false,
            responsive: true,
            modeBarButtonsToRemove: ["pan", "autoscale", "zoom", "toImage"],
            displaylogo: false,
          }}
          layout={{
            autosize: true,
            title: {
              text: "",
            },
            margin: {
              l: 10,
              r: 10,
              t: 4,
              b: 4,
            },
            xaxis: {
              range: displayClockRange,
              visible: false,
            },
            yaxis: {
              fixedrange: true,
              visible: false,
              range: [0, 1],
            },
            shapes: shapes,
          }}
        />
      </div>
    </div>
  );
}

export function ClockGraphs(props) {
  if (Object.keys(props.periodicEndpoint.data).length == 0) {
    return (
      <p style={{ color: "red" }}>
        Error - no data received from garud detector adapter
      </p>
    );
  }
  var clockDisplays = [];
  for (let clockIndex of Object.keys(
    getNested(props.periodicEndpoint.data, props.path)
  )) {
    clockDisplays.push(
      <ReadonlyClockGraph
        periodicEndpoint={props.periodicEndpoint}
        index={Number(clockIndex)}
        maxSignalRange={props.maxSignalRange}
        path={props.path}
      />
    );
  }
  return (
    <TitleCard
      title={
        <>
          <p style={{ marginBottom: "0px", float: "left" }}>
            Chip Stimulus Bit Displays
          </p>
          <div style={{ float: "right" }}>
            <ToggleButton
              periodicEndpoint={props.periodicEndpoint}
              path={props.path}
            />
          </div>
        </>
      }
    >
      <div
        style={{
          columnCount: "2",
        }}
      >
        {clockDisplays}
      </div>
    </TitleCard>
  );
}
