import { IAuthRepository } from "@/src/domain/repositories/IAuthRepository";
import {
  LoginCredentials,
  OtpVerification,
  OtpResponse,
  RegisterCredentials,
  PartialUserCredentials,
  EmailPasswordCredentials,
} from "@/src/domain/entities/AuthCredentials";
import { AuthUser, User, UserRole } from "@/src/domain/entities/User";
import { auth, db } from "@/src/infrastructure/firebase";
import {
  signInWithPhoneNumber,
  ConfirmationResult,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  linkWithCredential,
  EmailAuthProvider,
  OAuthCredential,
  User as FirebaseUser,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  collection,
  increment,
} from "firebase/firestore";
import { RecaptchaVerifier } from "firebase/auth";

// Almacenar el confirmationResult temporalmente
let confirmationResult: ConfirmationResult | null = null;
let recaptchaVerifier: RecaptchaVerifier | null = null;

// Site key de reCAPTCHA v3
const RECAPTCHA_SITE_KEY = "6LdtfCIsAAAAAGKD9vHbGG-HBRmYTbEp17_S9xhC";

// Esperar a que reCAPTCHA v3 esté disponible
function waitForRecaptcha(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Verificar si grecaptcha está disponible
    const checkRecaptcha = () => {
      return typeof (window as any).grecaptcha !== "undefined";
    };

    // Verificar inmediatamente
    if (checkRecaptcha()) {
      resolve();
      return;
    }

    // Esperar a que se cargue el script de reCAPTCHA
    let attempts = 0;
    const maxAttempts = 50; // 5 segundos máximo
    const checkInterval = setInterval(() => {
      attempts++;
      if (checkRecaptcha()) {
        clearInterval(checkInterval);
        resolve();
      } else if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        reject(new Error("reCAPTCHA no se pudo cargar después de 5 segundos"));
      }
    }, 100);
  });
}

// Inicializar reCAPTCHA verifier
async function initializeRecaptcha(): Promise<RecaptchaVerifier> {
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
      // Ignorar errores al limpiar verifier anterior
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

  // Esperar a que reCAPTCHA esté disponible
  try {
    await waitForRecaptcha();
  } catch (error) {
    // Continuar aunque no se pueda verificar reCAPTCHA
  }

  // Esperar un momento adicional para asegurar que el DOM está completamente cargado
  await new Promise((resolve) => setTimeout(resolve, 200));

  try {
    // Configuración de reCAPTCHA para Firebase Phone Authentication
    // IMPORTANTE: Firebase Phone Authentication usa reCAPTCHA v3 invisible internamente
    // El RecaptchaVerifier de Firebase maneja la integración con reCAPTCHA v3
    // El site key (6LdtfCIsAAAAAGKD9vHbGG-HBRmYTbEp17_S9xhC) debe estar vinculado
    // al proyecto en Firebase Console > Authentication > Settings
    recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "invisible",
      callback: () => {
        // reCAPTCHA resuelto
      },
      "expired-callback": () => {
        // reCAPTCHA expirado
        recaptchaVerifier = null;
      },
    });

    // El reCAPTCHA se renderiza automáticamente cuando se crea el verifier
    // Esperar un momento para asegurar que esté completamente inicializado
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return recaptchaVerifier;
  } catch (error: any) {
    console.error("Error al inicializar reCAPTCHA:", error.message);

    // Si hay un error, limpiar el verifier
    if (recaptchaVerifier) {
      try {
        recaptchaVerifier.clear();
      } catch (clearError) {
        // Ignorar errores al limpiar
      }
      recaptchaVerifier = null;
    }

    // Proporcionar mensaje de error más útil
    if (error.code === "auth/invalid-app-credential") {
      throw new Error(
        "Error de credenciales de aplicación Firebase. Por favor verifica:\n\n" +
          "1. Que el dominio esté autorizado en Firebase Console:\n" +
          "   - Ve a Authentication > Settings > Authorized domains\n" +
          "   - Asegúrate de que 'localhost' esté en la lista\n\n" +
          "2. Que reCAPTCHA esté correctamente configurado:\n" +
          "   - Ve a Authentication > Sign-in method > Phone\n" +
          "   - Verifica que Phone Authentication esté habilitado\n" +
          "   - Confirma que reCAPTCHA esté activo\n\n" +
          "3. Que las credenciales de la aplicación sean válidas:\n" +
          "   - Ve a Project Settings > General\n" +
          "   - Verifica que las credenciales web sean correctas\n\n" +
          "Error técnico: " +
          error.message
      );
    }

    throw error;
  }
}

// Formatear número de teléfono al formato internacional (+57 para Colombia)
// Formato esperado: +57XXXXXXXXXX (57 + 10 dígitos = 12 dígitos totales)
function formatPhoneNumberForFirebase(phoneNumber: string): string {
  // Remover todos los caracteres no numéricos
  const numbers = phoneNumber.replace(/\D/g, "");

  let formattedNumber: string;

  // Si el número ya empieza con 57 (código de país de Colombia)
  if (numbers.startsWith("57")) {
    // Verificar que tenga exactamente 12 dígitos (57 + 10 dígitos del teléfono)
    if (numbers.length === 12) {
      formattedNumber = `+${numbers}`;
    } else if (numbers.length > 12) {
      // Si tiene más de 12 dígitos, tomar solo los primeros 12
      formattedNumber = `+${numbers.substring(0, 12)}`;
    } else if (numbers.length > 2 && numbers.length < 12) {
      // Si tiene 57 pero menos de 12 dígitos, es inválido
      throw new Error(
        `Número de teléfono inválido. Debe tener 12 dígitos (57 + 10 dígitos). Se recibieron ${numbers.length} dígitos.`
      );
    } else {
      // Si solo tiene "57", es inválido
      throw new Error(
        "Número de teléfono inválido. Solo contiene el código de país."
      );
    }
  } else {
    // Si NO empieza con 57, agregar código de país +57
    // Verificar que tenga exactamente 10 dígitos (número colombiano sin código de país)
    if (numbers.length === 10) {
      formattedNumber = `+57${numbers}`;
    } else if (numbers.length < 10) {
      throw new Error(
        `Número de teléfono inválido. Debe tener 10 dígitos. Se recibieron ${numbers.length} dígitos.`
      );
    } else {
      // Si tiene más de 10 dígitos pero no empieza con 57, podría ser un número internacional
      // Por seguridad, solo tomamos los últimos 10 dígitos y agregamos +57
      const lastTenDigits = numbers.substring(numbers.length - 10);
      formattedNumber = `+57${lastTenDigits}`;
    }
  }

  // Validación final: debe tener exactamente 12 dígitos después del +
  const digitsOnly = formattedNumber.replace(/\D/g, "");
  if (digitsOnly.length !== 12) {
    throw new Error(
      `Error en formato final. El número debe tener 12 dígitos (57 + 10). Formato actual: ${formattedNumber} (${digitsOnly.length} dígitos)`
    );
  }

  // Validación adicional: debe empezar con +57
  if (!formattedNumber.startsWith("+57")) {
    throw new Error(
      `Error en formato final. El número debe empezar con +57. Formato actual: ${formattedNumber}`
    );
  }

  return formattedNumber;
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

      // Validación final antes de enviar a Firebase
      // El número debe tener formato: +57XXXXXXXXXX (12 dígitos después del +)
      const phoneDigits = formattedPhone.replace(/\D/g, "");
      if (!formattedPhone.startsWith("+57") || phoneDigits.length !== 12) {
        throw new Error(
          `Número de teléfono con formato inválido para Firebase. Esperado: +57XXXXXXXXXX (12 dígitos). Recibido: ${formattedPhone} (${phoneDigits.length} dígitos)`
        );
      }

      // Inicializar reCAPTCHA si no está inicializado
      const verifier = await initializeRecaptcha();

      // Enviar código OTP
      try {
        confirmationResult = await signInWithPhoneNumber(
          auth,
          formattedPhone,
          verifier
        );
      } catch (signInError: any) {
        // Limpiar verifier en caso de error
        if (recaptchaVerifier) {
          try {
            recaptchaVerifier.clear();
          } catch (clearError) {
            // Ignorar errores al limpiar
          }
          recaptchaVerifier = null;
        }

        // Proporcionar mensaje de error más específico
        if (signInError.code === "auth/invalid-app-credential") {
          throw new Error(
            "Error de credenciales de aplicación Firebase. Por favor verifica:\n" +
              "1. Que el dominio esté autorizado en Firebase Console > Authentication > Settings > Authorized domains\n" +
              "2. Que reCAPTCHA esté correctamente configurado en Firebase Console\n" +
              "3. Que las credenciales de la aplicación sean válidas\n\n" +
              "Error técnico: " +
              signInError.message
          );
        }

        throw signInError;
      }

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
      console.error("Error sending OTP:", error.message);

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

      // Obtener el documento del usuario en Firestore
      // NOTA: El documento parcial ya fue creado en el paso 1, aquí solo lo obtenemos
      // Si no existe, significa que el flujo no siguió el orden correcto
      const userDocRef = doc(db!, "users", firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      let user: User;

      if (userDoc.exists()) {
        // Usuario existe (fue creado en paso 1), obtener datos de Firestore
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
          address: userData.address,
          neighborhood: userData.neighborhood,
          latitude: userData.latitude,
          longitude: userData.longitude,
          leaderId: userData.leaderId,
          leaderName: userData.leaderName,
          createdAt: userData.createdAt?.toDate() || new Date(),
        };
      } else {
        // Si no existe el documento, significa que el paso 1 no se ejecutó correctamente
        // En este caso, creamos un documento mínimo para que el flujo continúe
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
      console.error("Error verifying OTP:", error.message);
      confirmationResult = null;
      throw new Error(
        error.message || "Código OTP inválido. Por favor, intenta nuevamente."
      );
    }
  }

  async validateUserExists(credentials: PartialUserCredentials): Promise<void> {
    if (credentials.documentNumber) {
      try {
        if (!db) {
          throw new Error("Firestore no está inicializado");
        }
        let userId = credentials.phoneNumber.replace(/\D/g, "");

        const usersRef = collection(db, "users");
        const q = query(
          usersRef,
          where("documentNumber", "==", credentials.documentNumber)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          // Verificar que no sea el mismo usuario
          const existingUser = querySnapshot.docs[0];
          if (existingUser.id !== userId) {
            throw new Error(
              "Ya existe un usuario registrado con este número de cédula"
            );
          }
        }
      } catch (validationError: any) {
        // Re-lanzar el error si es de validación de duplicado
        if (validationError.message.includes("Ya existe")) {
          throw validationError;
        }

        // Si es otro error, continuar sin lanzar
      }
    }
  }

  async createPartialUser(credentials: PartialUserCredentials): Promise<void> {
    try {
      if (!db) {
        throw new Error("Firestore no está inicializado");
      }

      // Si hay usuario autenticado, usar su UID, si no, usar el teléfono como ID temporal
      let userId = credentials.id;

      // Verificar si el documento de identidad ya existe
      await this.validateUserExists(credentials);

      // Crear o actualizar el documento del usuario en Firestore con datos parciales
      const userDocRef = doc(db, "users", userId);

      // Verificar si el usuario ya existe para obtener campaignIds existentes
      let existingCampaignIds: string[] = [];
      try {
        const existingUserDoc = await getDoc(userDocRef);
        if (existingUserDoc.exists() && existingUserDoc.data()) {
          const existingData = existingUserDoc.data();
          // Obtener campaignIds existentes o inicializar como array vacío
          existingCampaignIds = existingData.campaignIds || [];
          // Si existe campaignId (legacy), agregarlo también
          if (
            existingData.campaignId &&
            !existingCampaignIds.includes(existingData.campaignId)
          ) {
            existingCampaignIds.push(existingData.campaignId);
          }
        }
      } catch (checkError: any) {
        // Continuar asumiendo que es nuevo
        existingCampaignIds = [];
      }

      // Determinar el rol: MULTIPLIER si hay campaignId (puede ser el primero del árbol sin leaderId)
      // ADMIN solo si no hay campaignId
      const userRole: UserRole = credentials.campaignId
        ? "MULTIPLIER"
        : "ADMIN";

      const userData: any = {
        id: userId,
        phoneNumber: credentials.phoneNumber,
        name: `${credentials.firstName} ${credentials.lastName}`,
        firstName: credentials.firstName,
        lastName: credentials.lastName,
        documentNumber: credentials.documentNumber,
        role: userRole,
        updatedAt: serverTimestamp(),
        pendingAuth: true,
      };

      // Solo incluir datos de campaña/multiplicador si existen
      // IMPORTANTE: Solo guardar leaderId, no leaderName (es solo para UI)
      if (credentials.leaderId) {
        userData.leaderId = credentials.leaderId;
      }
      if (credentials.campaignId) {
        // Agregar la campaña a la lista de campañas del usuario
        // Si no está ya incluida, agregarla
        if (!existingCampaignIds.includes(credentials.campaignId)) {
          existingCampaignIds.push(credentials.campaignId);
        }
        userData.campaignIds = existingCampaignIds;
      } else {
        // Si no hay campaignId, mantener las campañas existentes o inicializar como array vacío
        userData.campaignIds =
          existingCampaignIds.length > 0 ? existingCampaignIds : [];
      }

      // Usar merge: true para actualizar solo los campos proporcionados
      await setDoc(userDocRef, userData, { merge: true });
    } catch (error: any) {
      console.error("Error al crear usuario parcial:", error.message);
      throw new Error(
        error.message ||
          "Error al crear usuario. Por favor, intenta nuevamente."
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
        try {
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
        } catch (validationError: any) {
          // Re-lanzar el error si es de validación de duplicado
          if (validationError.message.includes("Ya existe")) {
            throw validationError;
          }
          // Si es otro error, continuar sin lanzar
        }
      }

      // Crear o actualizar el documento del usuario en Firestore
      const userDocRef = doc(db!, "users", firebaseUser.uid);

      // Verificar si el usuario ya existe para no sobrescribir createdAt y campaignIds
      let userExists = false;
      let existingCampaignIds: string[] = [];
      try {
        const existingUserDoc = await getDoc(userDocRef);
        userExists = existingUserDoc.exists();
        if (userExists) {
          const existingData = existingUserDoc.data();
          if (existingData) {
            // Obtener campaignIds existentes o inicializar como array vacío
            existingCampaignIds = existingData.campaignIds || [];
            // Si existe campaignId (legacy), agregarlo también
            if (
              existingData.campaignId &&
              !existingCampaignIds.includes(existingData.campaignId)
            ) {
              existingCampaignIds.push(existingData.campaignId);
            }
          }
        }
      } catch (checkError: any) {
        // Continuar asumiendo que es nuevo
        userExists = false;
      }

      // Determinar el rol: MULTIPLIER si hay campaignId (puede ser el primero del árbol sin leaderId)
      // ADMIN solo si no hay campaignId
      const userRole: UserRole = credentials.campaignId
        ? "MULTIPLIER"
        : "ADMIN";

      const userData: any = {
        id: firebaseUser.uid,
        phoneNumber: firebaseUser.phoneNumber || credentials.phoneNumber,
        name: `${credentials.firstName} ${credentials.lastName}`,
        firstName: credentials.firstName,
        lastName: credentials.lastName,
        documentNumber: credentials.documentNumber,
        gender: credentials.gender || null,
        profession: credentials.profession || null,
        country: credentials.country,
        department: credentials.department,
        city: credentials.city,
        address: credentials.address,
        neighborhood: credentials.neighborhood,
        latitude: credentials.latitude || null,
        longitude: credentials.longitude || null,
        areaType: credentials.areaType || null,
        fromCapitalCity: credentials.fromCapitalCity ?? null,
        role: userRole,
        updatedAt: serverTimestamp(),
        pendingAuth: false, // Marcar como registro completo
      };

      // Solo incluir datos de campaña/multiplicador si existen
      // IMPORTANTE: Solo guardar leaderId, no leaderName (es solo para UI)
      if (credentials.leaderId) {
        userData.leaderId = credentials.leaderId;
      }
      if (credentials.campaignId) {
        // Agregar la campaña a la lista de campañas del usuario
        // Si no está ya incluida, agregarla
        if (!existingCampaignIds.includes(credentials.campaignId)) {
          existingCampaignIds.push(credentials.campaignId);
        }
        userData.campaignIds = existingCampaignIds;
      } else {
        // Si no hay campaignId, mantener las campañas existentes o inicializar como array vacío
        userData.campaignIds =
          existingCampaignIds.length > 0 ? existingCampaignIds : [];
      }

      // Solo establecer createdAt si el usuario no existe
      if (!userExists) {
        userData.createdAt = serverTimestamp();
      }

      // Verificar si es una nueva campaña para este usuario
      const isNewCampaign =
        credentials.campaignId &&
        !existingCampaignIds.includes(credentials.campaignId);

      await setDoc(userDocRef, userData, { merge: true });

      // Incrementar el contador de participants de la campaña si es una nueva campaña
      if (isNewCampaign && credentials.campaignId) {
        try {
          const campaignDocRef = doc(db!, "campaigns", credentials.campaignId);
          await updateDoc(campaignDocRef, {
            participants: increment(1),
            updatedAt: serverTimestamp(),
          });
          console.log(
            `✅ Contador de participants incrementado para campaña ${credentials.campaignId}`
          );
        } catch (campaignError: any) {
          // No fallar el registro si hay error al actualizar la campaña
          // Solo loguear el error
          console.error(
            `⚠️ Error al incrementar participants de la campaña ${credentials.campaignId}:`,
            campaignError.message
          );
        }
      }

      // Incrementar el contador de participants del multiplicador (líder) si existe
      if (credentials.leaderId) {
        try {
          const leaderDocRef = doc(db!, "users", credentials.leaderId);
          await updateDoc(leaderDocRef, {
            participants: increment(1),
            updatedAt: serverTimestamp(),
          });
          console.log(
            `✅ Contador de participants incrementado para multiplicador ${credentials.leaderId}`
          );
        } catch (leaderError: any) {
          // No fallar el registro si hay error al actualizar el líder
          // Solo loguear el error
          console.error(
            `⚠️ Error al incrementar participants del multiplicador ${credentials.leaderId}:`,
            leaderError.message
          );
        }
      }

      const user: User = {
        id: firebaseUser.uid,
        phoneNumber: firebaseUser.phoneNumber || credentials.phoneNumber,
        name: `${credentials.firstName} ${credentials.lastName}`,
        documentNumber: credentials.documentNumber,
        gender: credentials.gender,
        profession: credentials.profession,
        country: credentials.country,
        department: credentials.department,
        city: credentials.city,
        neighborhood: credentials.neighborhood,
        latitude: credentials.latitude,
        longitude: credentials.longitude,
        areaType: credentials.areaType,
        fromCapitalCity: credentials.fromCapitalCity,
        role: userRole,
        campaignIds: userData.campaignIds || [],
        createdAt: new Date(),
      };

      // Solo incluir datos de campaña/multiplicador si existen
      // IMPORTANTE: Solo guardar leaderId, no leaderName (es solo para UI)
      if (credentials.leaderId) {
        user.leaderId = credentials.leaderId;
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
      console.error("Error en registro completo:", error.message);
      throw new Error(
        error.message || "Error al registrarse. Por favor, intenta nuevamente."
      );
    }
  }

  // Helper function para obtener o crear usuario en Firestore después de autenticación
  private async getOrCreateFirestoreUser(
    firebaseUser: FirebaseUser,
    additionalData?: Partial<User>
  ): Promise<User> {
    if (!db) {
      throw new Error("Firestore no está inicializado");
    }

    const userDocRef = doc(db, "users", firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);

    let user: User;

    if (userDoc.exists()) {
      // Usuario existe, obtener datos de Firestore
      const userData = userDoc.data();
      user = {
        id: firebaseUser.uid,
        phoneNumber: firebaseUser.phoneNumber || userData.phoneNumber || undefined,
        email: firebaseUser.email || userData.email || undefined,
        name: userData.name || firebaseUser.displayName || "",
        role: userData.role as UserRole | undefined,
        documentNumber: userData.documentNumber,
        gender: userData.gender,
        profession: userData.profession,
        country: userData.country,
        department: userData.department,
        city: userData.city,
        address: userData.address,
        neighborhood: userData.neighborhood,
        latitude: userData.latitude,
        longitude: userData.longitude,
        leaderId: userData.leaderId,
        leaderName: userData.leaderName,
        campaignIds: userData.campaignIds || [],
        createdAt: userData.createdAt?.toDate() || new Date(),
        ...additionalData,
      };

      // Actualizar email si viene de Firebase Auth y no está en Firestore
      if (firebaseUser.email && !userData.email) {
        await updateDoc(userDocRef, {
          email: firebaseUser.email,
          updatedAt: serverTimestamp(),
        });
        user.email = firebaseUser.email;
      }
    } else {
      // Usuario no existe, crear documento mínimo
      const newUser: User = {
        id: firebaseUser.uid,
        phoneNumber: firebaseUser.phoneNumber || undefined,
        email: firebaseUser.email || undefined,
        name: firebaseUser.displayName || "",
        createdAt: new Date(),
        ...additionalData,
      };

      await setDoc(userDocRef, {
        ...newUser,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      user = newUser;
    }

    return user;
  }

  // Helper function para buscar usuario por email en Firestore
  private async findUserByEmail(email: string): Promise<User | null> {
    if (!db) {
      return null;
    }

    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        return {
          id: userDoc.id,
          phoneNumber: userData.phoneNumber,
          email: userData.email,
          name: userData.name || "",
          role: userData.role as UserRole | undefined,
          documentNumber: userData.documentNumber,
          gender: userData.gender,
          profession: userData.profession,
          country: userData.country,
          department: userData.department,
          city: userData.city,
          address: userData.address,
          neighborhood: userData.neighborhood,
          latitude: userData.latitude,
          longitude: userData.longitude,
          leaderId: userData.leaderId,
          leaderName: userData.leaderName,
          campaignIds: userData.campaignIds || [],
          createdAt: userData.createdAt?.toDate() || new Date(),
        };
      }
    } catch (error) {
      console.error("Error finding user by email:", error);
    }

    return null;
  }

  async signInWithEmailPassword(
    credentials: EmailPasswordCredentials
  ): Promise<AuthUser> {
    try {
      if (!auth) {
        throw new Error("Firebase Auth no está inicializado");
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(credentials.email)) {
        throw new Error("Formato de email inválido");
      }

      // Validar contraseña (mínimo 6 caracteres para Firebase)
      if (credentials.password.length < 6) {
        throw new Error("La contraseña debe tener al menos 6 caracteres");
      }

      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(
          auth,
          credentials.email,
          credentials.password
        );
      } catch (error: any) {
        // Manejar errores específicos de Firebase
        if (error.code === "auth/user-not-found") {
          throw new Error(
            "No existe una cuenta con este email. Por favor, regístrate primero."
          );
        } else if (error.code === "auth/wrong-password") {
          throw new Error("Contraseña incorrecta");
        } else if (error.code === "auth/invalid-email") {
          throw new Error("Formato de email inválido");
        } else if (error.code === "auth/user-disabled") {
          throw new Error("Esta cuenta ha sido deshabilitada");
        } else if (error.code === "auth/account-exists-with-different-credential") {
          throw new Error(
            "Ya existe una cuenta con este email usando otro método de autenticación"
          );
        }
        throw error;
      }

      const firebaseUser = userCredential.user;

      // Obtener o crear usuario en Firestore
      const user = await this.getOrCreateFirestoreUser(firebaseUser);

      // Obtener token de acceso
      const idToken = await firebaseUser.getIdToken();

      return {
        user,
        tokens: {
          accessToken: idToken,
        },
      };
    } catch (error: any) {
      console.error("Error signing in with email/password:", error.message);
      throw new Error(
        error.message || "Error al iniciar sesión. Intenta nuevamente."
      );
    }
  }

  async signInWithGoogle(): Promise<AuthUser> {
    try {
      if (!auth) {
        throw new Error("Firebase Auth no está inicializado");
      }

      const provider = new GoogleAuthProvider();
      // Solicitar email y perfil
      provider.addScope("email");
      provider.addScope("profile");

      let userCredential;
      try {
        userCredential = await signInWithPopup(auth, provider);
      } catch (error: any) {
        // Manejar errores específicos
        if (error.code === "auth/popup-closed-by-user") {
          throw new Error("Ventana de autenticación cerrada por el usuario");
        } else if (error.code === "auth/popup-blocked") {
          throw new Error(
            "Ventana emergente bloqueada. Por favor, permite ventanas emergentes para este sitio."
          );
        } else if (error.code === "auth/account-exists-with-different-credential") {
          // Intentar vincular cuentas automáticamente
          const email = error.customData?.email;
          if (email) {
            // Buscar usuario por email en Firestore
            const existingUser = await this.findUserByEmail(email);
            if (existingUser) {
              throw new Error(
                `Ya existe una cuenta con este email (${email}). Por favor, inicia sesión con el método original o contacta soporte para vincular cuentas.`
              );
            }
          }
          throw new Error(
            "Ya existe una cuenta con este email usando otro método de autenticación"
          );
        }
        throw error;
      }

      const firebaseUser = userCredential.user;
      const email = firebaseUser.email;

      if (!email) {
        throw new Error("No se pudo obtener el email de la cuenta de Google");
      }

      // Buscar usuario existente por email en Firestore
      const existingUser = await this.findUserByEmail(email);

      let user: User;

      if (existingUser && existingUser.id !== firebaseUser.uid) {
        // Usuario existe en Firestore pero con diferente UID
        // Intentar vincular la cuenta de Google a la cuenta existente
        try {
          // Obtener la credencial de Google
          const credential = GoogleAuthProvider.credentialFromResult(userCredential);
          if (!credential) {
            throw new Error("No se pudo obtener la credencial de Google");
          }

          // Buscar el usuario de Firebase Auth por email
          // Nota: Esto requiere que el usuario ya tenga una cuenta de Firebase Auth
          // Por ahora, creamos una nueva cuenta y actualizamos Firestore
          // En producción, podrías querer implementar un flujo más sofisticado

          // Actualizar el documento de Firestore para usar el nuevo UID
          if (db) {
            const oldUserDocRef = doc(db, "users", existingUser.id);
            const newUserDocRef = doc(db, "users", firebaseUser.uid);

            // Copiar datos del usuario existente al nuevo documento
            await setDoc(newUserDocRef, {
              ...existingUser,
              id: firebaseUser.uid,
              email: email,
              updatedAt: serverTimestamp(),
            });

            // Opcional: eliminar el documento antiguo o marcarlo como migrado
            // await deleteDoc(oldUserDocRef);
          }

          user = {
            ...existingUser,
            id: firebaseUser.uid,
            email: email,
          };
        } catch (linkError: any) {
          console.error("Error linking account:", linkError);
          // Si falla la vinculación, crear nueva cuenta
          user = await this.getOrCreateFirestoreUser(firebaseUser, {
            email: email,
            name: firebaseUser.displayName || existingUser.name,
          });
        }
      } else {
        // Usuario no existe o es el mismo, crear/obtener normalmente
        user = await this.getOrCreateFirestoreUser(firebaseUser, {
          email: email,
          name: firebaseUser.displayName || "",
        });
      }

      // Obtener token de acceso
      const idToken = await firebaseUser.getIdToken();

      return {
        user,
        tokens: {
          accessToken: idToken,
        },
      };
    } catch (error: any) {
      console.error("Error signing in with Google:", error.message);
      throw new Error(
        error.message || "Error al iniciar sesión con Google. Intenta nuevamente."
      );
    }
  }

  async registerWithEmailPassword(
    credentials: RegisterCredentials
  ): Promise<AuthUser> {
    try {
      if (!auth || !db) {
        throw new Error("Firebase no está inicializado");
      }

      if (!credentials.email || !credentials.password) {
        throw new Error("Email y contraseña son requeridos para el registro");
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(credentials.email)) {
        throw new Error("Formato de email inválido");
      }

      // Validar contraseña
      if (credentials.password.length < 6) {
        throw new Error("La contraseña debe tener al menos 6 caracteres");
      }

      // Verificar si el email ya está en uso
      const existingUser = await this.findUserByEmail(credentials.email);
      if (existingUser) {
        throw new Error(
          "Ya existe una cuenta con este email. Por favor, inicia sesión."
        );
      }

      // Verificar si el documento de identidad ya existe
      if (credentials.documentNumber) {
        try {
          const usersRef = collection(db, "users");
          const q = query(
            usersRef,
            where("documentNumber", "==", credentials.documentNumber)
          );
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const existingUser = querySnapshot.docs[0];
            throw new Error(
              "Ya existe un usuario registrado con este número de cédula"
            );
          }
        } catch (validationError: any) {
          if (validationError.message.includes("Ya existe")) {
            throw validationError;
          }
        }
      }

      let userCredential;
      try {
        userCredential = await createUserWithEmailAndPassword(
          auth,
          credentials.email,
          credentials.password
        );
      } catch (error: any) {
        if (error.code === "auth/email-already-in-use") {
          throw new Error(
            "Ya existe una cuenta con este email. Por favor, inicia sesión."
          );
        } else if (error.code === "auth/invalid-email") {
          throw new Error("Formato de email inválido");
        } else if (error.code === "auth/weak-password") {
          throw new Error("La contraseña es muy débil");
        }
        throw error;
      }

      const firebaseUser = userCredential.user;

      // Verificar si el usuario ya existe para no sobrescribir createdAt y campaignIds
      let userExists = false;
      let existingCampaignIds: string[] = [];
      const userDocRef = doc(db, "users", firebaseUser.uid);
      try {
        const existingUserDoc = await getDoc(userDocRef);
        userExists = existingUserDoc.exists();
        if (userExists) {
          const existingData = existingUserDoc.data();
          if (existingData) {
            existingCampaignIds = existingData.campaignIds || [];
            if (
              existingData.campaignId &&
              !existingCampaignIds.includes(existingData.campaignId)
            ) {
              existingCampaignIds.push(existingData.campaignId);
            }
          }
        }
      } catch (checkError: any) {
        userExists = false;
      }

      // Determinar el rol
      const userRole: UserRole = credentials.campaignId
        ? "MULTIPLIER"
        : "ADMIN";

      const userData: any = {
        id: firebaseUser.uid,
        email: credentials.email,
        phoneNumber: credentials.phoneNumber || undefined,
        name: `${credentials.firstName} ${credentials.lastName}`,
        firstName: credentials.firstName,
        lastName: credentials.lastName,
        documentNumber: credentials.documentNumber,
        gender: credentials.gender || null,
        profession: credentials.profession || null,
        country: credentials.country,
        department: credentials.department,
        city: credentials.city,
        address: credentials.address,
        neighborhood: credentials.neighborhood,
        latitude: credentials.latitude || null,
        longitude: credentials.longitude || null,
        areaType: credentials.areaType || null,
        fromCapitalCity: credentials.fromCapitalCity ?? null,
        role: userRole,
        updatedAt: serverTimestamp(),
        pendingAuth: false,
      };

      if (credentials.leaderId) {
        userData.leaderId = credentials.leaderId;
      }
      if (credentials.campaignId) {
        if (!existingCampaignIds.includes(credentials.campaignId)) {
          existingCampaignIds.push(credentials.campaignId);
        }
        userData.campaignIds = existingCampaignIds;
      } else {
        userData.campaignIds =
          existingCampaignIds.length > 0 ? existingCampaignIds : [];
      }

      if (!userExists) {
        userData.createdAt = serverTimestamp();
      }

      const isNewCampaign =
        credentials.campaignId &&
        !existingCampaignIds.includes(credentials.campaignId);

      await setDoc(userDocRef, userData, { merge: true });

      // Incrementar contadores si es necesario
      if (isNewCampaign && credentials.campaignId) {
        try {
          const campaignDocRef = doc(db, "campaigns", credentials.campaignId);
          await updateDoc(campaignDocRef, {
            participants: increment(1),
            updatedAt: serverTimestamp(),
          });
        } catch (campaignError: any) {
          console.error(
            `Error al incrementar participants de la campaña:`,
            campaignError.message
          );
        }
      }

      if (credentials.leaderId) {
        try {
          const leaderDocRef = doc(db, "users", credentials.leaderId);
          await updateDoc(leaderDocRef, {
            participants: increment(1),
            updatedAt: serverTimestamp(),
          });
        } catch (leaderError: any) {
          console.error(
            `Error al incrementar participants del multiplicador:`,
            leaderError.message
          );
        }
      }

      const user: User = {
        id: firebaseUser.uid,
        email: credentials.email,
        phoneNumber: credentials.phoneNumber || undefined,
        name: `${credentials.firstName} ${credentials.lastName}`,
        documentNumber: credentials.documentNumber,
        gender: credentials.gender,
        profession: credentials.profession,
        country: credentials.country,
        department: credentials.department,
        city: credentials.city,
        neighborhood: credentials.neighborhood,
        latitude: credentials.latitude,
        longitude: credentials.longitude,
        areaType: credentials.areaType,
        fromCapitalCity: credentials.fromCapitalCity,
        role: userRole,
        campaignIds: userData.campaignIds || [],
        createdAt: new Date(),
      };

      if (credentials.leaderId) {
        user.leaderId = credentials.leaderId;
      }

      const idToken = await firebaseUser.getIdToken();

      return {
        user,
        tokens: {
          accessToken: idToken,
        },
      };
    } catch (error: any) {
      console.error("Error registering with email/password:", error.message);
      throw new Error(
        error.message || "Error al registrarse. Por favor, intenta nuevamente."
      );
    }
  }

  async linkAuthProvider(
    providerId: string,
    credential: any
  ): Promise<void> {
    try {
      if (!auth || !auth.currentUser) {
        throw new Error("Usuario no autenticado");
      }

      const currentUser = auth.currentUser;

      if (providerId === "google.com") {
        const googleCredential = credential as OAuthCredential;
        await linkWithCredential(currentUser, googleCredential);
      } else if (providerId === "password") {
        const emailCredential = EmailAuthProvider.credential(
          credential.email,
          credential.password
        );
        await linkWithCredential(currentUser, emailCredential);
      } else {
        throw new Error(`Proveedor de autenticación no soportado: ${providerId}`);
      }
    } catch (error: any) {
      console.error("Error linking auth provider:", error.message);
      if (error.code === "auth/credential-already-in-use") {
        throw new Error("Esta credencial ya está asociada con otra cuenta");
      } else if (error.code === "auth/email-already-in-use") {
        throw new Error("Este email ya está asociado con otra cuenta");
      }
      throw new Error(
        error.message || "Error al vincular método de autenticación"
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
                gender: userData.gender,
                profession: userData.profession,
                country: userData.country,
                department: userData.department,
                city: userData.city,
                neighborhood: userData.neighborhood,
                latitude: userData.latitude,
                longitude: userData.longitude,
                areaType: userData.areaType,
                fromCapitalCity: userData.fromCapitalCity,
                leaderId: userData.leaderId,
                leaderName: userData.leaderName,
                campaignIds: userData.campaignIds || [],
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
