const StatCard = ({ value, label, helper }) => {
  return (
    <article className="ag-stat-card">
      <strong>{value}</strong>
      <span>{label}</span>
      {helper && <p>{helper}</p>}
    </article>
  );
};

export default StatCard;
