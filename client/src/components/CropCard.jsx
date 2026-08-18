import cropImage from "../assets/crop-image.png";

const CropCard = ({ title, description }) => {
  return (
    <article className="ag-card">
      <img src={cropImage} alt="" />
      <div>
        <p>{title}</p>
        <h3>{description}</h3>
      </div>
    </article>
  );
};

export default CropCard;
