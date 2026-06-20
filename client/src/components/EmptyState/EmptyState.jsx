const EmptyState = ({ title, message, action = null }) => {
  return (
    <section className="ag-empty-state">
      <h2>{title}</h2>
      {message && <p>{message}</p>}
      {action && <div>{action}</div>}
    </section>
  );
};

export default EmptyState;
