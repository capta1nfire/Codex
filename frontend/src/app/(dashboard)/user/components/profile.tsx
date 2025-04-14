import React from 'react';

const Profile = () => {
  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">Mi Perfil</h2>
      <div className="space-y-4">
        {/* Información del usuario */}
        <div className="bg-gray-100 p-4 rounded-md">
          <h3 className="font-semibold">Información Personal</h3>
          <p>Nombre: [Nombre del Usuario]</p>
          <p>Email: [email@example.com]</p>
        </div>

        {/* Opciones para cambiar contraseña, email, etc. */}
        <div className="bg-gray-100 p-4 rounded-md">
          <h3 className="font-semibold">Opciones</h3>
          <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-2">
            Cambiar Contraseña
          </button>
          <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-2">
            Cambiar Email
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;