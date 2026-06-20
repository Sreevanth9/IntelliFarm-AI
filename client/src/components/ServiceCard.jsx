import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const ServiceCard = ({ service }) => {
  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.18 }}>
      <Link className="home-service-card" to={service.route}>
        <img src={service.icon} alt="" />
        <h3>{service.title}</h3>
        <p>{service.description}</p>
        <span>Open module</span>
      </Link>
    </motion.div>
  );
};

export default ServiceCard;
