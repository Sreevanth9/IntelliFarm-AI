import weatherIcon from "../assets/weather-icon.png";

const WeatherCard = ({ title, value, helper }) => {
  return (
    <article className="ag-card">
      <img src={weatherIcon} alt="" />
      <div>
        <p>{title}</p>
        <h3>{value}</h3>
        {helper && <span>{helper}</span>}
      </div>
    </article>
  );
};

export default WeatherCard;
