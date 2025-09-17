import { EditableClockGraph, ClockGraphs } from "./ClockDisplays";
import { useState } from "react";
import Container from "react-bootstrap/Container";

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

export function getPulseGeneratorPages(periodicEndpoint) {
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
              getPulseGeneratorPageNames(periodicEndpoint)[i],
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

export function getPulseGeneratorPageNames(periodicEndpoint) {
  if (Object.keys(periodicEndpoint.data).length > 0) {
    return Object.keys(periodicEndpoint.data.application.pulse_generators);
  } else {
    return [];
  }
}
