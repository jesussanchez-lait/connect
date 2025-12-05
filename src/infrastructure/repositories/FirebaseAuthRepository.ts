import { IAuthRepository } from "@/src/domain/repositories/IAuthRepository";
import {
  LoginCredentials,
  OtpVerification,
  OtpResponse,
  RegisterCredentials,
} from "@/src/domain/entities/AuthCredentials";
import { AuthUser, User, UserRole } from "@/src/domain/entities/User";
import { auth, db } from "@/src/infrastructure/firebase";
import {
  signInWithPhoneNumber,
  ConfirmationResult,
  PhoneAuthProvider,
  signInWithCredential,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  collection,
} from "firebase/firestore";
import { RecaptchaVerifier } from "firebase/auth";

// Almacenar el confirmationResult temporalmente
let confirmationResult: ConfirmationResult | null = null;
let recaptchaVerifier: RecaptchaVerifier | null = null;

// Inicializar reCAPTCHA verifier
function initializeRecaptcha(): RecaptchaVerifier {
  if (typeof window === "undefined") {
    throw new Error("reCAPTCHA solo puede inicializarse en el cliente");
  }

  if (!auth) {
    throw new Error("Firebase Auth no está inicializado");
  }

  // Limpiar verifier anterior si existe
  if (recaptchaVerifier) {
    try {
      recaptchaVerifier.clear();
    } catch (error) {
      // Ignorar errores al limpiar
    }
    recaptchaVerifier = null;
  }

  // Verificar que el contenedor existe
  const container = document.getElementById("recaptcha-container");
  if (!container) {
    throw new Error(
      "Contenedor de reCAPTCHA no encontrado. Asegúrate de tener un elemento con id 'recaptcha-container' en el DOM."
    );
  }

  // Configuración de reCAPTCHA
  // Nota: El sitio de reCAPTCHA "lait-connect" debe estar configurado en Firebase Console
  // Firebase maneja automáticamente el site key a través de la configuración del proyecto
  recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
    size: "invisible",
    callback: () => {
      // reCAPTCHA resuelto
      console.log("reCAPTCHA verificado para lait-connect");
    },
    "expired-callback": () => {
      // reCAPTCHA expirado
      console.error("reCAPTCHA expirado");
      recaptchaVerifier = null;
    },
  });

  return recaptchaVerifier;
}

// Formatear número de teléfono al formato internacional (+57 para Colombia)
function formatPhoneNumberForFirebase(phoneNumber: string): string {
  // Remover todos los caracteres no numéricos
  const numbers = phoneNumber.replace(/\D/g, "");

  // Si el número ya empieza con 57 (código de país de Colombia)
  if (numbers.startsWith("57")) {
    // Verificar si tiene más de 2 dígitos (57 + número de teléfono)
    if (numbers.length > 2) {
      return `+${numbers}`;
    }
    // Si solo tiene "57", es inválido
    throw new Error("Número de teléfono inválido");
  }

  // Si tiene exactamente 10 dígitos, agregar código de país +57 (Colombia)
  if (numbers.length === 10) {
    return `+57${numbers}`;
  }

  // Si tiene menos de 10 dígitos, intentar agregar +57 de todas formas
  // pero esto podría ser un error, así que lanzamos un error si es muy corto
  if (numbers.length < 10) {
    throw new Error(
      `Número de teléfono inválido. Debe tener 10 dígitos. Se recibieron ${numbers.length} dígitos.`
    );
  }

  // Si tiene más de 10 dígitos pero no empieza con 57, podría ser un número internacional
  // Por defecto, asumimos que es Colombia y agregamos +57
  return `+57${numbers}`;
}

export class FirebaseAuthRepository implements IAuthRepository {
  async sendOtp(credentials: LoginCredentials): Promise<OtpResponse> {
    try {
      if (!auth) {
        throw new Error("Firebase Auth no está inicializado");
      }

      const formattedPhone = formatPhoneNumberForFirebase(
        credentials.phoneNumber
      );

      // Inicializar reCAPTCHA si no está inicializado
      const verifier = initializeRecaptcha();

      // Enviar código OTP
      confirmationResult = await signInWithPhoneNumber(
        auth,
        formattedPhone,
        verifier
      );

      // En desarrollo, podemos obtener el código de verificación
      // Nota: Esto solo funciona en el emulador de Firebase
      let devOtpCode: string | undefined;
      if (process.env.NODE_ENV === "development") {
        // En desarrollo, Firebase Auth emulator puede proporcionar el código
        // Por ahora, retornamos éxito sin código
        devOtpCode = undefined;
      }

      return {
        success: true,
        message: "Código OTP enviado exitosamente",
        otpCode: devOtpCode,
      };
    } catch (error: any) {
      console.error("Error sending OTP:", error);
      return {
        success: false,
        message:
          error.message || "Error al enviar código OTP. Intenta nuevamente.",
      };
    }
  }

  async verifyOtp(verification: OtpVerification): Promise<AuthUser> {
    try {
      if (!confirmationResult) {
        throw new Error(
          "No hay una verificación pendiente. Por favor, solicita un nuevo código."
        );
      }

      if (!auth) {
        throw new Error("Firebase Auth no está inicializado");
      }

      // Verificar el código OTP
      const userCredential = await confirmationResult.confirm(
        verification.otpCode
      );
      const firebaseUser = userCredential.user;

      // Limpiar el confirmationResult
      confirmationResult = null;

      // Obtener o crear el documento del usuario en Firestore
      const userDocRef = doc(db!, "users", firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      let user: User;

      if (userDoc.exists()) {
        // Usuario existe, obtener datos de Firestore
        const userData = userDoc.data();
        user = {
          id: firebaseUser.uid,
          phoneNumber: firebaseUser.phoneNumber || verification.phoneNumber,
          name: userData.name || "",
          role: userData.role as UserRole | undefined,
          documentNumber: userData.documentNumber,
          country: userData.country,
          department: userData.department,
          city: userData.city,
          neighborhood: userData.neighborhood,
          latitude: userData.latitude,
          longitude: userData.longitude,
          leaderId: userData.leaderId,
          leaderName: userData.leaderName,
          createdAt: userData.createdAt?.toDate() || new Date(),
        };
      } else {
        // Usuario nuevo, crear documento básico
        const newUser: User = {
          id: firebaseUser.uid,
          phoneNumber: firebaseUser.phoneNumber || verification.phoneNumber,
          name: "",
          createdAt: new Date(),
        };

        await setDoc(userDocRef, {
          ...newUser,
          createdAt: serverTimestamp(),
        });

        user = newUser;
      }

      // Obtener el token de acceso
      const idToken = await firebaseUser.getIdToken();

      return {
        user,
        tokens: {
          accessToken: idToken,
        },
      };
    } catch (error: any) {
      console.error("Error verifying OTP:", error);
      confirmationResult = null;
      throw new Error(
        error.message || "Código OTP inválido. Por favor, intenta nuevamente."
      );
    }
  }

  async register(credentials: RegisterCredentials): Promise<AuthUser> {
    try {
      if (!auth) {
        throw new Error("Firebase Auth no está inicializado");
      }

      if (!auth.currentUser) {
        throw new Error(
          "Debes verificar tu número de teléfono primero. Por favor, inicia sesión."
        );
      }

      const firebaseUser = auth.currentUser;

      // Verificar si el documento de identidad ya existe
      if (credentials.documentNumber) {
        const usersRef = collection(db!, "users");
        const q = query(
          usersRef,
          where("documentNumber", "==", credentials.documentNumber)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          // Verificar que no sea el mismo usuario
          const existingUser = querySnapshot.docs[0];
          if (existingUser.id !== firebaseUser.uid) {
            throw new Error(
              "Ya existe un usuario registrado con este número de cédula"
            );
          }
        }
      }

      // Crear o actualizar el documento del usuario en Firestore
      const userDocRef = doc(db!, "users", firebaseUser.uid);
      const userData = {
        id: firebaseUser.uid,
        phoneNumber: firebaseUser.phoneNumber || credentials.phoneNumber,
        name: `${credentials.firstName} ${credentials.lastName}`,
        documentNumber: credentials.documentNumber,
        country: credentials.country,
        department: credentials.department,
        city: credentials.city,
        neighborhood: credentials.neighborhood,
        latitude: credentials.latitude || null,
        longitude: credentials.longitude || null,
        leaderId: credentials.leaderId,
        leaderName: credentials.leaderName,
        campaignId: credentials.campaignId,
        role: "FOLLOWER" as UserRole, // Rol por defecto para nuevos usuarios
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(userDocRef, userData, { merge: true });

      const user: User = {
        id: firebaseUser.uid,
        phoneNumber: firebaseUser.phoneNumber || credentials.phoneNumber,
        name: `${credentials.firstName} ${credentials.lastName}`,
        documentNumber: credentials.documentNumber,
        country: credentials.country,
        department: credentials.department,
        city: credentials.city,
        neighborhood: credentials.neighborhood,
        latitude: credentials.latitude,
        longitude: credentials.longitude,
        leaderId: credentials.leaderId,
        leaderName: credentials.leaderName,
        role: "FOLLOWER",
        createdAt: new Date(),
      };

      // Obtener el token de acceso
      const idToken = await firebaseUser.getIdToken();

      return {
        user,
        tokens: {
          accessToken: idToken,
        },
      };
    } catch (error: any) {
      console.error("Error registering user:", error);
      throw new Error(
        error.message || "Error al registrarse. Por favor, intenta nuevamente."
      );
    }
  }

  async logout(): Promise<void> {
    try {
      if (!auth) {
        throw new Error("Firebase Auth no está inicializado");
      }

      await firebaseSignOut(auth);
      confirmationResult = null;

      // Limpiar reCAPTCHA verifier
      if (recaptchaVerifier) {
        recaptchaVerifier.clear();
        recaptchaVerifier = null;
      }
    } catch (error) {
      console.error("Error logging out:", error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      if (!auth || !db) {
        return null;
      }

      // TypeScript assertion: ya verificamos que auth y db no son null
      const authInstance = auth;
      const dbInstance = db;

      return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(
          authInstance,
          async (firebaseUser) => {
            unsubscribe();

            if (!firebaseUser) {
              resolve(null);
              return;
            }

            try {
              // Obtener datos del usuario de Firestore
              const userDocRef = doc(dbInstance, "users", firebaseUser.uid);
              const userDoc = await getDoc(userDocRef);

              if (!userDoc.exists()) {
                resolve(null);
                return;
              }

              const userData = userDoc.data();
              const user: User = {
                id: firebaseUser.uid,
                phoneNumber: firebaseUser.phoneNumber || undefined,
                name: userData.name || "",
                role: userData.role as UserRole | undefined,
                documentNumber: userData.documentNumber,
                country: userData.country,
                department: userData.department,
                city: userData.city,
                neighborhood: userData.neighborhood,
                latitude: userData.latitude,
                longitude: userData.longitude,
                leaderId: userData.leaderId,
                leaderName: userData.leaderName,
                createdAt: userData.createdAt?.toDate() || new Date(),
              };

              resolve(user);
            } catch (error) {
              console.error("Error getting current user:", error);
              resolve(null);
            }
          }
        );
      });
    } catch (error) {
      console.error("Error getting current user:", error);
      return null;
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthUser["tokens"]> {
    try {
      if (!auth || !auth.currentUser) {
        throw new Error("Usuario no autenticado");
      }

      // Firebase maneja la renovación de tokens automáticamente
      // Solo necesitamos obtener un nuevo token
      const idToken = await auth.currentUser.getIdToken(true); // true fuerza la renovación

      return {
        accessToken: idToken,
      };
    } catch (error) {
      console.error("Error refreshing token:", error);
      throw new Error("Error al renovar el token");
    }
  }
}
