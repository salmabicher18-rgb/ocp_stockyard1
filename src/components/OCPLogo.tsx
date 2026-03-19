import ocpLogo from "@/assets/ocp-logo.png";

const OCPLogo = ({ className = "" }: { className?: string }) => (
  <img src={ocpLogo} alt="OCP Group Logo" className={className} />
);

export default OCPLogo;
