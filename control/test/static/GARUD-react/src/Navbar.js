import { Link } from "react-router-dom";

function Navbar() {
  return (
    <>
      <nav className="navbar">
        <img
          src="odin.png"
          height="30"
          class="d-inline-block align-top"
          alt="Odin Control Logo"
          style={{ marginLeft: "5px", marginRight: "10px" }}
        />
        <p>GARUD</p>
        <Link to="/">Main</Link>
        <Link to="/gpio_direct">GPIO Direct</Link>
        <Link to="/configuration">Configuration</Link>
        <Link to="/debug_register">Debug Register Test</Link>
        <Link to="/sensor_stimulus">FW/SW Sensor Stimulus</Link>
        <Link to="/pulse_generator_1">Pulse Generator 1</Link>
        <Link to="/pulse_generator_2">Pulse Generator 2</Link>
        <Link to="/detector_json">Detector JSON</Link>
        <Link to="/power_supply_json">Power Supply JSON</Link>
      </nav>
    </>
  );
}

export default Navbar;
