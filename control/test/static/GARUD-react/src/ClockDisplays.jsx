import { useState, useEffect, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import Plot from "react-plotly.js";
import { TitleCard } from "odin-react";
//import { DropdownButton, Dropdown } from "react-bootstrap/Dropdown";
import { DropdownButton, Dropdown } from "react-bootstrap";
import { getNested } from "./HelperFunctions";

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
    getNested(
      props.periodicEndpoint.data,
      props.path.slice(0, props.path.length - 1)
    )["enable"]
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

function HighLowToggleButton(props) {
  function updateValue() {
    var temp =
      (getNested(
        props.periodicEndpoint.data,
        props.path.slice(0, props.path.length - 1)
      )["preset"] &
        (1 << props.index)) >>>
      props.index;
    if (temp == 0) {
      temp = 1;
    } else {
      temp = 0;
    }
    temp = temp << props.index;
    var newValue =
      (getNested(
        props.periodicEndpoint.data,
        props.path.slice(0, props.path.length - 1)
      )["preset"] &
        (~1 << props.index)) |
      temp;

    props.periodicEndpoint
      .put(
        {
          ["preset"]: newValue,
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
  var text = "Preset: Low";
  if (
    (getNested(
      props.periodicEndpoint.data,
      props.path.slice(0, props.path.length - 1)
    )["preset"] &
      (1 << props.index)) >>>
      props.index ==
    1
  ) {
    text = "Preset: High";
  }
  return (
    <input
      style={{
        backgroundColor: "80FF80",
        color: "white",
        borderColor: "80FF80",
        borderStyle: "solid",
        borderRadius: "5px",
      }}
      type="Button"
      className="nice-button"
      readOnly
      onClick={updateValue}
      value={text}
    />
  );
}

function TextEntry(props) {
  var ref = useRef();
  return (
    <>
      <p key={props.i} style={{ display: "inline-block", width: "150px" }}>
        Transition point {props.i + 1}:
        <br />
        <input
          style={{ width: "100%" }}
          type="number"
          className="textInput"
          ref={ref}
          value={
            ref.current === document.activeElement
              ? ref.value
              : props.tps[props.i].x0
          }
          onKeyDown={(event) =>
            props.alterLineValue(String(props.i + 1), event)
          }
        />
      </p>
    </>
  );
}

function TextEntries(props) {
  var textEntries = [];
  for (let i = 0; i < props.tps.length; i++) {
    textEntries.push(
      <div className="mytooltip">
        <TextEntry
          key={i}
          alterLineValue={props.alterLineValue}
          tps={props.tps}
          i={i}
        />
        {
          <span className="mytooltiptext">
            {"Function: pulse_generator.set_channel_point"}
          </span>
        }
      </div>
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

  const index = props.index;
  const setIndex = props.setIndex;

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
    layer: "above",
    line: {
      color: "red",
      width: 3,
    },
  };

  var maxSignalRange = getNested(
    periodicEndpoint.data,
    props.path.slice(0, props.path.length - 1)
  )["counter_max"];

  var tps = [];
  var presetRef = useRef();
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
      layer: "below",
      line: {
        color: "green",
        width: 3,
      },
    });
  }

  const [signalRange, setSignalRange] = useState([
    0,
    Math.min(Math.max(lp.x0 * 1.1, lp.x0 + 1, 2), maxSignalRange),
  ]);

  useEffect(() => {
    calculateWaveShape("5", 0);
  }, [
    getNested(
      props.periodicEndpoint.data,
      props.path.slice(0, props.path.length - 1)
    )["preset"],
    JSON.stringify(tps),
    lp.x0,
  ]);
  useEffect(() => {
    setSignalRange([
      0,
      lp.x0 == 0
        ? maxSignalRange
        : Math.min(Math.max(lp.x0 * 1.1, lp.x0 + 1, 2), maxSignalRange),
    ]);
  }, [index]);
  useEffect(() => {
    setSignalRange([
      0,
      lp.x0 == 0
        ? maxSignalRange
        : Math.min(Math.max(lp.x0 * 1.1, lp.x0 + 1, 2), maxSignalRange),
    ]);
    setIndex(0);
  }, [props.number]);

  function calculateWaveShape(shapeIndex, value) {
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
    var preset =
      (getNested(
        props.periodicEndpoint.data,
        props.path.slice(0, props.path.length - 1)
      )["preset"] >>>
        index) &
      1;
    var y = [preset == 0 ? 0.001 : 0.999];
    var low = !preset;
    var x = [0];
    for (let i = 0; i < xValues.length; i++) {
      x.push(xValues[i]);
      x.push(xValues[i]);
      if (low) {
        y.push(0.001);
        y.push(0.999);
      } else {
        y.push(0.999);
        y.push(0.001);
      }
      low = !low;
    }
    x.push(Math.round(lpx0copy));
    if (low) {
      y.push(0.001);
    } else {
      y.push(0.999);
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
    if (Number(shapeIndex) > 0) {
      props.periodicEndpoint
        .put(
          { [shapeIndex - 1]: Math.round(Math.min(value, maxSignalRange)) },
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
        0
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
      // setSignalRange([
      //   Math.max(mp.x0 - range * 0.1, 0),
      //   Math.min(Math.max(value + range * 0.1, value + 1, 2), maxSignalRange),
      // ]);
      var needsMoving = [];
      for (let i = 0; i < tps.length; i++) {
        if (Math.round(tps[i].x0) > Math.round(newPosition)) {
          needsMoving.push(String(i));
        }
      }
      for (let i = 0; i < needsMoving.length; i++) {
        var position =
          value + (value - mp.x0) * (0.08 / needsMoving.length) * (i + 1);
        if (newPosition == 0) {
          position = 0;
        }
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
      // } else if (shapeIndex == "1") {
      //   var newPosition = Math.max(Math.round(Math.min(value, lp.x0 - 1)), 0);
      //   var range = lp.x0 - newPosition;
      //   setMp({
      //     x0: newPosition,
      //     y0: -100,
      //     x1: newPosition,
      //     y1: 100,
      //     line: {
      //       color: "black",
      //       width: 3,
      //     },
      //   });
      //   setSignalRange([
      //     Math.max(newPosition - range * 0.1, 0),
      //     Math.min(Math.max(lp.x0 + range * 0.1, lp.x0 + 1, 2), maxSignalRange),
      //   ]);

      //   var needsMoving = [];
      //   for (let i = 0; i < tps.length; i++) {
      //     if (Math.round(tps[i].x0) > Math.round(lp.x0)) {
      //       needsMoving.push(String(i));
      //     }
      //   }
      //   for (let i = 0; i < needsMoving.length; i++) {
      //     var position =
      //       lp.x0 + (lp.x0 - newPosition) * (0.08 / needsMoving.length) * (i + 1);
      //     props.periodicEndpoint
      //       .put(
      //         { [needsMoving[i]]: Math.ceil(Math.min(position, maxSignalRange)) },
      //         props.path.join("/") + "/" + index + "/transitions"
      //       )
      //       .then((response) => {
      //         props.periodicEndpoint.mergeData(
      //           response,
      //           props.path.join("/") + "/" + index + "/transitions"
      //         );
      //       })
      //       .catch((err) => {
      //         console.error(err);
      //       });
      //   }
    }
  }

  function onLineMovement(event) {
    if (!Object.keys(event)[0].includes("shapes")) {
      return;
    }
    var shapeIndex = Object.keys(event)[0].split("[")[1][0];
    moveLines(shapeIndex, event["shapes[" + shapeIndex + "].x0"]);
  }

  function resetLoopPoint() {
    moveLines("0", maxSignalRange);
    calculateWaveShape("4", maxSignalRange);
    resetRange();
  }

  function resetRange() {
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
    calculateWaveShape("5", 0);
  }

  function zoomIn() {
    setSignalRange([
      Math.max(mp.x0 - (lp.x0 - mp.x0) * 0.1, 0),
      Math.min(
        Math.max(lp.x0 + (lp.x0 - mp.x0) * 0.1, lp.x0 + 1, 2),
        maxSignalRange
      ),
    ]);
  }

  function alterLineValue(shapeIndex, event) {
    if (event.key == "Enter") {
      moveLines(shapeIndex, Number(event.target.value));
    }
  }

  function editPreset(event) {
    if (event.key == "Enter") {
      props.periodicEndpoint
        .put(
          {
            ["preset"]: parseInt(event.target.value, 16),
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
    } else {
      //backspace, delete, left, right
      var whitelist = [8, 46, 37, 39];
      var e = event || window.event;
      var key = e.keyCode || e.which;
      if (
        (key < 48 || key > 57) &&
        (key < 65 || key > 70) &&
        !whitelist.includes(key)
      ) {
        if (e.preventDefault) {
          e.preventDefault();
        }
        e.returnValue = false;
      }
    }
  }

  return (
    <TitleCard
      title={
        <>
          <div style={{ float: "left" }}>
            <p style={{ marginBottom: "0px", float: "left" }}>
              Edit Chip Stimulus Bit Settings
            </p>
          </div>
          <div style={{ float: "right" }}>
            <p style={{ marginBottom: "0px", display: "inline-block" }}>
              Preset:
            </p>
            &nbsp;
            <div className="mytooltip" style={{ width: "24%" }}>
              <input
                style={{ display: "inline-block", width: "120px" }}
                className="textInput"
                type="input"
                ref={presetRef}
                value={
                  presetRef.current === document.activeElement
                    ? presetRef.value
                    : getNested(
                        props.periodicEndpoint.data,
                        props.path.slice(0, props.path.length - 1)
                      )["preset"].toString(16)
                }
                onKeyDown={editPreset}
              />
              {
                <span className="mytooltiptext">
                  {"Function: pulse_generator.set_preset"}
                </span>
              }
            </div>
          </div>
        </>
      }
    >
      <div style={{ marginBottom: "5px" }}>
        <div style={{ display: "inline-block" }}>
          <DropdownButton
            title={
              "Clock Stimulus Bit: " +
                getNested(periodicEndpoint.data, props.path)[String(index)][
                  "endpoint"
                ] || "Clock Stimulus Bit: None Selected"
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
                  {
                    getNested(periodicEndpoint.data, props.path)[
                      String(selection)
                    ]["endpoint"]
                  }
                </Dropdown.Item>
              )
            )}
          </DropdownButton>
        </div>
        &nbsp;
        <div style={{ display: "inline-block", marginBottom: "1%" }}>
          <div className="mytooltip">
            <HighLowToggleButton
              periodicEndpoint={periodicEndpoint}
              path={props.path}
              index={index}
            />
            {
              <span className="mytooltiptext">
                {"Function: pulse_generator.set_preset"}
              </span>
            }
          </div>
        </div>
        <div className="mytooltip">
          <input
            style={{ float: "right", width: "8%", minWidth: "115px" }}
            onClick={resetLoopPoint}
            className="nice-button"
            type="button"
            value="Reset LP"
            readOnly
          />
          {
            <span className="mytooltiptext">
              {"Function: pulse_generator.set_channel_loop"}
            </span>
          }
        </div>
        <div style={{ float: "right", width: "10px", height: "10px" }} />
        <input
          style={{ float: "right", width: "8%", minWidth: "115px" }}
          onClick={resetRange}
          className="nice-button"
          type="button"
          value="Zoom Out"
          readOnly
        />
        <div style={{ float: "right", width: "10px", height: "10px" }} />
        <input
          style={{ float: "right", width: "8%", minWidth: "115px" }}
          onClick={zoomIn}
          className="nice-button"
          type="button"
          value="Zoom In"
          readOnly
        />
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
            shapes: [/*mp,*/ lp, ...tps],
          }}
        />
        <div
          style={{
            display: "flex",
            flexFlow: "row wrap",
            justifyContent: "space-around",
          }}
        >
          <TextEntries tps={tps} alterLineValue={alterLineValue} />
          <p style={{ display: "inline-block", width: "150px" }}>
            Loop point: <br />
            <div className="mytooltip">
              <input
                style={{ width: "100%" }}
                type="number"
                ref={lpref}
                className="textInput"
                value={
                  lpref.current === document.activeElement ? lpref.value : lp.x0
                }
                onKeyDown={(event) => alterLineValue("0", event)}
              />
              {
                <span className="mytooltiptext">
                  {"Function: pulse_generator.set_channel_loop"}
                </span>
              }
            </div>
          </p>
        </div>
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
  // const [displayClockRange, setDisplayClockRange] = useState([
  //   0,
  //   Math.max(2, maxSignalRange),
  // ]);
  var displayClockRange = [0, Math.max(2, maxSignalRange)];
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
        width: 1,
      },
    },
  ];

  useEffect(() => {
    calculateWaveShape();
  }, [
    getNested(
      props.periodicEndpoint.data,
      props.path.slice(0, props.path.length - 1)
    )["preset"],
    JSON.stringify(tps),
    lp.x0,
  ]);

  function calculateWaveShape() {
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
    var preset =
      (getNested(
        props.periodicEndpoint.data,
        props.path.slice(0, props.path.length - 1)
      )["preset"] >>>
        index) &
      1;
    var y = [preset == 0 ? 0.001 : 0.999];
    var low = !preset;
    for (let i = 0; i < xValues.length; i++) {
      x.push(xValues[i]);
      x.push(xValues[i]);
      if (low) {
        y.push(0.001);
        y.push(0.999);
      } else {
        y.push(0.999);
        y.push(0.001);
      }
      low = !low;
    }
    x.push(Math.round(lpx0copy));
    if (low) {
      y.push(0.001);
    } else {
      y.push(0.999);
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

  // function resize(event) {
  //   if ("xaxis.range" in event) {
  //     setDisplayClockRange(event["xaxis.range"]);
  //   } else if ("xaxis.range[0]" in event) {
  //     setDisplayClockRange([
  //       Math.max(event["xaxis.range[0]"], 0),
  //       Math.min(event["xaxis.range[1]"], maxSignalRange),
  //     ]);
  //   }
  // }

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
      <div style={{ width: "120px" }} onClick={() => props.setIndex(index)}>
        <div className="nametooltip">
          {getNested(periodicEndpoint.data, props.path)[String(index)][
            "endpoint"
          ].slice(-11)}
          {getNested(periodicEndpoint.data, props.path)[String(index)][
            "endpoint"
          ].length > 11 ? (
            <span className="nametooltiptext">
              {
                getNested(periodicEndpoint.data, props.path)[String(index)][
                  "endpoint"
                ]
              }
            </span>
          ) : (
            <></>
          )}
        </div>
      </div>
      <div className="calculate120">
        <Plot
          style={{ height: "30px" }}
          //onRelayout={resize}
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
      <TitleCard
        title={
          <>
            <p style={{ marginBottom: "0px", float: "left" }}>
              Chip Stimulus Bit Displays
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
  var clockDisplays = [];
  for (let clockIndex of Object.keys(
    getNested(props.periodicEndpoint.data, props.path)
  )) {
    clockDisplays.push(
      <ReadonlyClockGraph
        key={clockIndex}
        periodicEndpoint={props.periodicEndpoint}
        index={Number(clockIndex)}
        maxSignalRange={props.maxSignalRange}
        path={props.path}
        setIndex={props.setIndex}
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
            <div className="mytooltip" style={{ width: "24%" }}>
              <ToggleButton
                periodicEndpoint={props.periodicEndpoint}
                path={props.path}
              />
              {
                <span className="mytooltiptext">
                  {"Function: pulse_generator.enable"}
                </span>
              }
            </div>
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
