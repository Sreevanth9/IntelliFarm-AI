const SectionTitle = ({ eyebrow, title, subtitle, action = null }) => {
  return (
    <div className="ag-section-title">
      <div>
        {eyebrow && <p className="ag-eyebrow">{eyebrow}</p>}
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

export default SectionTitle;
