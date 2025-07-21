import { Link } from "react-router-dom";

function PulseGeneratorLinks(periodicEndpoint) {
  if (Object.keys(periodicEndpoint.data).length > 0) {
    var links = [];
    for (
      let i = 0;
      i <
      Object.keys(periodicEndpoint.data.application.pulse_generators).length;
      i++
    ) {
      links.push(
        <Link key={i} to={"/pulse_generator_" + String(i)}>
          Pulse Generator {String(i)}
        </Link>
      );
    }
    return links;
  }
}

function Navbar(props) {
  return (
    <>
      <nav className="navbar">
        <img
          src="odin.png"
          height="30"
          className="d-inline-block align-top"
          alt="Odin Control Logo"
          style={{ marginLeft: "5px", marginRight: "10px" }}
        />
        <p>GARUD</p>
        <Link to="/">Main</Link>
        <Link to="/gpio_direct">GPIO Direct</Link>
        <Link to="/configuration">Configuration</Link>
        <Link to="/debug_register">Debug Register Test</Link>
        <Link to="/sensor_stimulus">FW/SW Sensor Stimulus</Link>
        {/* <Link to="/pulse_generator_1">Pulse Generator 1</Link>
        <Link to="/pulse_generator_2">Pulse Generator 2</Link> */}
        {PulseGeneratorLinks(props.periodicEndpoint)}
        <Link to="/detector_json">Detector JSON</Link>
        <Link to="/power_supply_json">Power Supply JSON</Link>
      </nav>
    </>
  );
}

export default Navbar;
