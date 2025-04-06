import { auth, db, rtdb } from "../firebase_config.js";
import {
  onAuthStateChanged,
  signOut,
  updatePassword,
  updateProfile,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import {
  ref,
  onValue,
  set,
  push,
  remove,
  update
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Referencias a elementos del DOM
const userName = document.getElementById("userName");
const userEmail = document.getElementById("userEmail");
const signOutButton = document.getElementById("signOutButton");
const editNameButton = document.getElementById("editNameButton");
const changePasswordButton = document.getElementById("changePasswordButton");
const parkingsList = document.getElementById("parkingsList");
const addParkingButton = document.getElementById("addParkingButton");

// Cargar modales dinámicamente
async function loadModals() {
    const modalsContainer = document.getElementById("modals-container");

    const modalFiles = [
        "static/components/modals/editNameModal.html",
        "static/components/modals/changePasswordModal.html",
        "static/components/modals/addParkingModal.html",
    ];

    for (const file of modalFiles) {
        const response = await fetch(file);
        const html = await response.text();
        modalsContainer.innerHTML += html;
    }
}

// Inicializar modales
loadModals().then(() => {
    console.log("Modales cargados correctamente");

    // Referencias a los modales después de cargarlos
    const editNameModal = document.getElementById("editNameModal");
    const changePasswordModal = document.getElementById("changePasswordModal");
    const addParkingModal = document.getElementById("addParkingModal");

    // Cerrar modales al hacer clic fuera de ellos
    window.addEventListener("click", (event) => {
        if (event.target === editNameModal) {
            editNameModal.style.display = "none";
        }
        if (event.target === changePasswordModal) {
            changePasswordModal.style.display = "none";
        }
        if (event.target === addParkingModal) {
            addParkingModal.style.display = "none";
        }
    });

    // Botones de cancelar
    document.getElementById("cancelNameButton").addEventListener("click", () => {
        editNameModal.style.display = "none";
    });

    document.getElementById("cancelPasswordButton").addEventListener("click", () => {
        changePasswordModal.style.display = "none";
    });

    document.getElementById("cancelParkingButton").addEventListener("click", () => {
        addParkingModal.style.display = "none";
    });

    // Abrir modal de editar nombre
    editNameButton.addEventListener("click", () => {
        document.getElementById("newUserName").value = ""; // Limpiar el input
        editNameModal.style.display = "block";
    });

    // Abrir modal de cambiar contraseña
    changePasswordButton.addEventListener("click", () => {
        document.getElementById("oldPassword").value = ""; // Limpiar el input
        document.getElementById("newPassword").value = ""; // Limpiar el input
        document.getElementById("confirmPassword").value = ""; // Limpiar el input
        changePasswordModal.style.display = "block";
    });

    // Abrir modal de agregar parking
    addParkingButton.addEventListener("click", () => {
        addParkingModal.style.display = "block";
    });

    // Mostrar/ocultar contraseña
    document.querySelectorAll(".toggle-password").forEach((icon) => {
        icon.addEventListener("click", () => {
            const input = icon.previousElementSibling;
            if (input.type === "password") {
                input.type = "text";
                icon.textContent = "visibility";
            } else {
                input.type = "password";
                icon.textContent = "visibility_off";
            }
        });
    });

    // Guardar nuevo nombre
    document.getElementById("saveNameButton").addEventListener("click", async () => {
        const newName = document.getElementById("newUserName").value;
        if (newName) {
            try {
                await updateProfile(auth.currentUser, { displayName: newName });
                userName.textContent = newName;
                editNameModal.style.display = "none";
            } catch (error) {
                console.error("Error al actualizar el nombre:", error);
                alert("Error al actualizar el nombre. Inténtalo de nuevo.");
            }
        }
    });

    // Guardar nueva contraseña
    document.getElementById("savePasswordButton").addEventListener("click", async () => {
        const oldPassword = document.getElementById("oldPassword").value;
        const newPassword = document.getElementById("newPassword").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        if (newPassword !== confirmPassword) {
            alert("Las nuevas contraseñas no coinciden. Inténtalo de nuevo.");
            return;
        }

        if (!oldPassword) {
            alert("Debes ingresar la contraseña anterior.");
            return;
        }

        try {
            // Verificar la contraseña anterior
            const user = auth.currentUser;
            const credential = EmailAuthProvider.credential(user.email, oldPassword);
            await reauthenticateWithCredential(user, credential);

            // Cambiar la contraseña
            await updatePassword(user, newPassword);
            alert("Contraseña actualizada correctamente");
            changePasswordModal.style.display = "none";
        } catch (error) {
            console.error("Error al actualizar la contraseña:", error);
            alert("Error al actualizar la contraseña. Verifica la contraseña anterior e inténtalo de nuevo.");
        }
    });

    // Agregar nuevo parking
    document.getElementById("saveParkingButton").addEventListener("click", async () => {
        const label = document.getElementById("newParkingLabel").value;
        const status = "libre"; // Default status
        const device = "arduino"; // Default device

        if (label) {
            try {
                // Usar Realtime Database en lugar de Firestore
                const parkingsRef = ref(rtdb, 'parkings');
                const newParkingRef = push(parkingsRef);
                await set(newParkingRef, { 
                    label, 
                    status, 
                    device,
                    updated_at: Date.now()
                });
                alert("Parking agregado correctamente");
                addParkingModal.style.display = "none";
            } catch (error) {
                console.error("Error al agregar el parking:", error);
                alert("Error al agregar el parking. Inténtalo de nuevo.");
            }
        } else {
            alert("Debes ingresar un nombre para el parking.");
        }
    });
});

// Función para verificar si el usuario es administrador
const isAdmin = async (userId) => {
  const userDoc = await getDoc(doc(db, "users", userId));
  if (userDoc.exists()) {
    const userData = userDoc.data();
    return userData.role === "admin";
  }
  return false;
};

// Inicializar
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // Verificar si el usuario es administrador
    const admin = await isAdmin(user.uid);
    if (admin) {
      // Cargar datos del perfil
      userName.textContent = user.displayName || "Administrador";
      userEmail.textContent = user.email;
    } else {
      alert("No tienes permisos para acceder a esta página.");
      window.location.href = "/profile";
    }
  } else {
    window.location.href = "/login";
  }
});

// Event listeners para los botones
signOutButton.addEventListener("click", () => {
  signOut(auth).then(() => {
    window.location.href = "/login";
  });
});

document.getElementById("manageUsers").addEventListener("click", () => {
  window.location.href = "/manageUsers";
});

document.getElementById("messagesButton").addEventListener("click", () => {
  window.location.href = "/messages";
});

// Obtener parkings
const getParkings = () => {
    console.log("Iniciando obtención de parkings desde RTDB...");
    // Usar Realtime Database en lugar de Firestore
    const parkingsRef = ref(rtdb, 'parkings');
    
    onValue(parkingsRef, (snapshot) => {
        console.log("Respuesta de RTDB recibida");
        parkingsList.innerHTML = ""; // Limpiar lista
        
        if (snapshot.exists()) {
            console.log("✅ Datos encontrados en parkings");
            const data = snapshot.val();
            console.log("Datos recibidos:", JSON.stringify(data));
            
            // Verificar si data es null o undefined
            if (!data) {
                console.error("❌ Los datos son null o undefined");
                parkingsList.innerHTML = "<p>No hay cajones disponibles. Por favor agregue uno.</p>";
                return;
            }
            
            // Verificar si data es un objeto vacío
            if (Object.keys(data).length === 0) {
                console.log("📣 No hay cajones configurados");
                parkingsList.innerHTML = "<p>No hay cajones configurados. Puede agregar uno con el botón de abajo.</p>";
                return;
            }
            
            // Convertir el objeto en array para facilitar la iteración
            let count = 0;
            Object.entries(data).forEach(([key, parking]) => {
                console.log(`Procesando parking ${key}:`, parking);
                count++;
                
                const parkingItem = document.createElement("div");
                parkingItem.className = "parking-item";

                // Mostrar nombre y estado del parking
                parkingItem.innerHTML = `
                    <span>${parking.label}</span>
                    <span class="parking-status ${parking.status}">${parking.status}</span>
                    <div>
                        <button class="btn-small green" data-id="${key}" data-status="libre">Disponible</button>
                        <button class="btn-small red" data-id="${key}" data-status="ocupado">Ocupado</button>
                        <button class="btn-small orange" data-id="${key}" data-status="servicio">En Servicio</button>
                        <button class="btn-small grey" data-id="${key}" data-action="delete">Eliminar</button>
                    </div>
                `;
                parkingsList.appendChild(parkingItem);
                
                // Agregar event listeners a los botones
                const buttons = parkingItem.querySelectorAll('button');
                buttons.forEach(button => {
                    button.addEventListener('click', () => {
                        const id = button.dataset.id;
                        const action = button.dataset.action;
                        
                        if (action === 'delete') {
                            deleteParking(id);
                        } else {
                            updateParkingStatus(id, button.dataset.status);
                        }
                    });
                });
            });
            
            console.log(`Total de cajones procesados: ${count}`);
        } else {
            console.error("❌ No existen datos en la ruta 'parkings'");
            parkingsList.innerHTML = "<p>No hay cajones configurados en el sistema. Utilice el botón para agregar uno.</p>";
        }
    }, (error) => {
        console.error("Error al obtener datos de parkings:", error);
        parkingsList.innerHTML = `<p>Error al cargar los cajones: ${error.message}</p>`;
    });
};

// Función para actualizar el estado del parking
window.updateParkingStatus = (parkingId, status) => {
    try {
        const parkingRef = ref(rtdb, `parkings/${parkingId}`);
        update(parkingRef, { 
            status,
            updated_at: Date.now()
        });
    } catch (error) {
        console.error("Error al actualizar el estado del parking:", error);
        alert("Error al actualizar el estado del parking. Inténtalo de nuevo.");
    }
};

// Función para eliminar un parking
window.deleteParking = (parkingId) => {
    if (confirm("¿Estás seguro de que deseas eliminar este parking?")) {
        try {
            const parkingRef = ref(rtdb, `parkings/${parkingId}`);
            remove(parkingRef);
        } catch (error) {
            console.error("Error al eliminar el parking:", error);
            alert("Error al eliminar el parking. Inténtalo de nuevo.");
        }
    }
};

// Función para verificar la conexión a Firebase
const checkFirebaseConnection = async () => {
    try {
        console.log("Verificando conexión con Firebase...");
        // Primero intentamos con el endpoint del servidor Flask
        const serverCheck = await fetch('/api/check-firebase');
        const serverResponse = await serverCheck.json();
        
        if (serverResponse.connected) {
            console.log("✅ Conexión verificada con el servidor:", serverResponse);
            return true;
        }
        
        // Si el servidor no está disponible, intentamos directo con Firebase
        console.log("⚠️ Verificación con el servidor falló. Intentando directamente...");
        
        // Verificar usando RTDB directamente
        const testRef = ref(rtdb, 'system/test');
        return new Promise((resolve) => {
            onValue(testRef, (snapshot) => {
                console.log("✅ Verificación directa con Firebase exitosa");
                resolve(true);
            }, (error) => {
                console.error("❌ Error en verificación directa:", error);
                resolve(false);
            }, { onlyOnce: true });
            
            // Timeout en caso de que Firebase no responda
            setTimeout(() => {
                console.error("❌ Timeout en verificación directa con Firebase");
                resolve(false);
            }, 5000);
        });
    } catch (error) {
        console.error("Error al verificar conexión:", error);
        return false;
    }
};

// Inicializar la app
const initApp = async () => {
    let connectionChecked = false;
    let connectionOk = false;
    
    try {
        // Verificar la conexión a Firebase
        connectionOk = await checkFirebaseConnection();
        connectionChecked = true;
        
        // Si la conexión es exitosa, cargar los parkings
        if (connectionOk) {
            console.log("🔥 Inicializando carga de cajones...");
            getParkings();
        } else {
            console.error("❌ No hay conexión con Firebase");
            parkingsList.innerHTML = `
                <div class="error-container">
                    <p>Error de conexión con Firebase. No se pueden cargar los cajones.</p>
                    <button id="retryButton" class="btn waves-effect waves-light">
                        <i class="material-icons left">refresh</i> Reintentar
                    </button>
                </div>
            `;
            
            // Agregar botón para reintentar
            document.getElementById("retryButton").addEventListener("click", () => {
                parkingsList.innerHTML = "<p>Intentando reconectar...</p>";
                setTimeout(initApp, 1000);
            });
        }
    } catch (error) {
        console.error("Error al inicializar la app:", error);
        parkingsList.innerHTML = `<p>Error al inicializar: ${error.message}</p>`;
    }
};

// Cargar datos
document.addEventListener("DOMContentLoaded", () => {
    initApp();
});