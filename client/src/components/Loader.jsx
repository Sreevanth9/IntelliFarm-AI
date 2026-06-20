const Loader = ({ label = "Loading" }) => {
  return (
    <div className="ag-loader" role="status" aria-live="polite">
      <span className="ag-loader__ring" />
      <span>{label}</span>
    </div>
  );
};

export default Loader;
