import { getInitials } from "../../../services/profileStorage";

import "./Avatar.css";

function Avatar({ name, photo, className = "" }) {
  return (
    <div className={`avatar ${className}`}>
      {photo ? (
        <img
          className="avatar-image"
          src={photo}
          alt={name ? `${name}'s profile photo` : "Profile photo"}
        />
      ) : (
        getInitials(name)
      )}
    </div>
  );
}

export default Avatar;
