import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <main className="ag-page ag-not-found">
      <section>
        <p className="ag-eyebrow">404</p>
        <h1>Page not found</h1>
        <p>The route you opened does not exist in IntelliFarm AI.</p>
        <Link className="ag-primary-btn" to="/">Go Home</Link>
      </section>
    </main>
  );
};

export default NotFound;
