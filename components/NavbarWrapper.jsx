import { getSession } from "@/app/lib/auth";
import Navbar from "./Navbar";

const NavbarWrapper = async () => {
  const currentUser = await getSession();

  return <Navbar currentUser={currentUser} />;
};

export default NavbarWrapper;
