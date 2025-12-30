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
  signInAnonymously,
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

  // Verificar que el contenedor existe y está disponible
  const container = document.getElementById("recaptcha-container");
  if (!container) {
    throw new Error(
      "Contenedor de reCAPTCHA no encontrado. Asegúrate de tener un elemento con id 'recaptcha-container' en el DOM."
    );
  }

  // Verificar que el contenedor no esté oculto con display: none
  const containerStyle = window.getComputedStyle(container);
  if (containerStyle.display === "none") {
    console.warn(
      "⚠️ El contenedor de reCAPTCHA está oculto con display: none. Esto puede causar problemas. Usa 'sr-only' o 'invisible' en lugar de 'hidden'."
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

  // Validar que Firebase Auth esté correctamente configurado
  if (!auth.app.options.projectId) {
    throw new Error(
      "Firebase Auth no está correctamente configurado. El projectId es requerido."
    );
  }

  try {
    // Configuración de reCAPTCHA para Firebase Phone Authentication
    // IMPORTANTE: Firebase Phone Authentication usa reCAPTCHA v3 invisible internamente
    // El RecaptchaVerifier de Firebase maneja la integración con reCAPTCHA v3
    // El site key (6LdtfCIsAAAAAGKD9vHbGG-HBRmYTbEp17_S9xhC) debe estar vinculado
    // al proyecto en Firebase Console > Authentication > Settings
    console.log("🔐 Inicializando reCAPTCHA verifier...", {
      projectId: auth.app.options.projectId,
      authDomain: auth.app.options.authDomain,
      containerExists: !!container,
    });

    recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "invisible",
      callback: () => {
        console.log("✅ reCAPTCHA resuelto correctamente");
      },
      "expired-callback": () => {
        console.warn("⚠️ reCAPTCHA expirado");
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
      const currentDomain =
        typeof window !== "undefined" ? window.location.hostname : "unknown";
      const currentOrigin =
        typeof window !== "undefined" ? window.location.origin : "unknown";

      console.error("❌ Error de credenciales de Firebase:", {
        code: error.code,
        message: error.message,
        currentDomain,
        currentOrigin,
        projectId: auth?.app?.options?.projectId,
        authDomain: auth?.app?.options?.authDomain,
      });

      throw new Error(
        "Error de credenciales de aplicación Firebase. Por favor verifica:\n\n" +
          "1. Que el dominio esté autorizado en Firebase Console:\n" +
          `   - Ve a Authentication > Settings > Authorized domains\n` +
          `   - Asegúrate de que '${currentDomain}' esté en la lista\n` +
          `   - Para desarrollo local, 'localhost' DEBE estar en la lista\n\n` +
          "2. Que reCAPTCHA esté correctamente configurado:\n" +
          "   - Ve a Authentication > Sign-in method > Phone\n" +
          "   - Verifica que Phone Authentication esté habilitado\n" +
          "   - Confirma que reCAPTCHA esté activo\n\n" +
          "3. Que las credenciales de la aplicación sean válidas:\n" +
          "   - Ve a Project Settings > General\n" +
          "   - Verifica que las credenciales web sean correctas\n" +
          `   - Project ID actual: ${
            auth?.app?.options?.projectId || "no configurado"
          }\n` +
          `   - Auth Domain actual: ${
            auth?.app?.options?.authDomain || "no configurado"
          }\n\n` +
          "4. Limpia la caché del navegador y recarga la página\n\n" +
          `Error técnico: ${error.message}`
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
          const currentDomain =
            typeof window !== "undefined"
              ? window.location.hostname
              : "unknown";

          console.error("❌ Error de credenciales al enviar OTP:", {
            code: signInError.code,
            message: signInError.message,
            currentDomain,
            projectId: auth?.app?.options?.projectId,
          });

          throw new Error(
            "Error de credenciales de aplicación Firebase. Por favor verifica:\n\n" +
              "1. Que el dominio esté autorizado en Firebase Console:\n" +
              `   - Ve a Authentication > Settings > Authorized domains\n` +
              `   - Asegúrate de que '${currentDomain}' esté en la lista\n` +
              `   - Para desarrollo local, 'localhost' DEBE estar en la lista\n\n` +
              "2. Que reCAPTCHA esté correctamente configurado:\n" +
              "   - Ve a Authentication > Sign-in method > Phone\n" +
              "   - Verifica que Phone Authentication esté habilitado\n" +
              "   - Confirma que reCAPTCHA esté activo\n\n" +
              "3. Que las credenciales de la aplicación sean válidas:\n" +
              "   - Ve a Project Settings > General\n" +
              "   - Verifica que las credenciales web sean correctas\n\n" +
              "4. Limpia la caché del navegador y recarga la página\n\n" +
              `Error técnico: ${signInError.message}`
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

      // Usar el UID proporcionado (debe ser el UID real de Firebase Auth)
      const userId = credentials.id;

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

      // Incluir género y profesión si están disponibles
      if (credentials.gender) {
        userData.gender = credentials.gender;
      }
      if (credentials.profession) {
        userData.profession = credentials.profession;
      }

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
      let wasPendingAuth = false; // Indica si el usuario estaba en registro parcial
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
            // Verificar si el usuario estaba en registro parcial (pendingAuth: true)
            wasPendingAuth = existingData.pendingAuth === true;
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
        name: `${credentials.firstName} ${credentials.lastName}`,
        firstName: credentials.firstName,
        lastName: credentials.lastName,
        documentNumber: credentials.documentNumber,
        country: credentials.country,
        department: credentials.department,
        city: credentials.city,
        address: credentials.address,
        neighborhood: credentials.neighborhood,
        role: userRole,
        updatedAt: serverTimestamp(),
        pendingAuth: false, // Marcar como registro completo
      };

      // Solo incluir campos opcionales si tienen valor (no undefined)
      const phoneNumber = firebaseUser.phoneNumber || credentials.phoneNumber;
      if (phoneNumber) {
        userData.phoneNumber = phoneNumber;
      }
      if (credentials.gender) {
        userData.gender = credentials.gender;
      }
      if (credentials.profession) {
        userData.profession = credentials.profession;
      }
      if (credentials.latitude !== undefined && credentials.latitude !== null) {
        userData.latitude = credentials.latitude;
      }
      if (
        credentials.longitude !== undefined &&
        credentials.longitude !== null
      ) {
        userData.longitude = credentials.longitude;
      }
      if (credentials.areaType) {
        userData.areaType = credentials.areaType;
      }
      if (credentials.fromCapitalCity !== undefined) {
        userData.fromCapitalCity = credentials.fromCapitalCity;
      }

      // Solo incluir datos de campaña/multiplicador si existen
      // IMPORTANTE: Solo guardar leaderId, no leaderName (es solo para UI)
      if (credentials.leaderId) {
        userData.leaderId = credentials.leaderId;
      }

      // IMPORTANTE: Determinar si debemos incrementar el contador de la campaña
      // Incrementamos si:
      // 1. Hay un campaignId en las credenciales
      // 2. Y (el usuario no existía antes O el usuario estaba en registro parcial - pendingAuth: true)
      //
      // NO incrementamos si:
      // - El usuario ya estaba completamente registrado (pendingAuth: false) y ya tenía el campaignId
      //   (esto evitaría duplicados si se llama register múltiples veces)
      //
      // Nota: Si wasPendingAuth es true, significa que createPartialUser ya agregó el campaignId
      // a existingCampaignIds, así que sabemos que el usuario se está registrando en esta campaña
      const shouldIncrementCampaignCounter =
        credentials.campaignId && (!userExists || wasPendingAuth);

      // Log para debugging
      if (credentials.campaignId) {
        console.log(
          `🔍 [register] Verificando campaña ${credentials.campaignId}:`,
          {
            userExists,
            wasPendingAuth,
            existingCampaignIds,
            shouldIncrementCampaignCounter,
            userRole,
          }
        );
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

      await setDoc(userDocRef, userData, { merge: true });

      // Incrementar el contador de participants de la campaña cuando se completa un registro nuevo
      // IMPORTANTE: Incrementamos cuando:
      // - El usuario estaba en registro parcial (pendingAuth: true) y ahora se completa el registro
      // - O el usuario es completamente nuevo
      // Esto asegura que cada vez que se completa el registro de un multiplicador o seguidor, se cuenta
      if (shouldIncrementCampaignCounter && credentials.campaignId) {
        try {
          const campaignDocRef = doc(db!, "campaigns", credentials.campaignId);
          await updateDoc(campaignDocRef, {
            participants: increment(1),
            updatedAt: serverTimestamp(),
          });
          console.log(
            `✅ [register] Contador de participants incrementado para campaña ${credentials.campaignId}. Rol: ${userRole} (Registro completado)`
          );
        } catch (campaignError: any) {
          // No fallar el registro si hay error al actualizar la campaña
          // Solo loguear el error
          console.error(
            `⚠️ [register] Error al incrementar participants de la campaña ${credentials.campaignId}:`,
            campaignError.message
          );
        }
      } else if (credentials.campaignId) {
        console.log(
          `ℹ️ [register] Usuario ya estaba completamente registrado en la campaña ${credentials.campaignId}, no se incrementa el contador (evita duplicados)`
        );
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
        phoneNumber:
          firebaseUser.phoneNumber || userData.phoneNumber || undefined,
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

      // Preparar datos para Firestore, eliminando campos undefined
      const firestoreData: any = {
        id: newUser.id,
        name: newUser.name,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Solo incluir campos si tienen valor (no undefined)
      if (newUser.phoneNumber !== undefined) {
        firestoreData.phoneNumber = newUser.phoneNumber;
      }
      if (newUser.email !== undefined) {
        firestoreData.email = newUser.email;
      }
      if (additionalData) {
        Object.keys(additionalData).forEach((key) => {
          const value = (additionalData as any)[key];
          if (value !== undefined) {
            firestoreData[key] = value;
          }
        });
      }

      await setDoc(userDocRef, firestoreData);

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
        } else if (
          error.code === "auth/account-exists-with-different-credential"
        ) {
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
        } else if (
          error.code === "auth/account-exists-with-different-credential"
        ) {
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
          const credential =
            GoogleAuthProvider.credentialFromResult(userCredential);
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
        error.message ||
          "Error al iniciar sesión con Google. Intenta nuevamente."
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

  async linkAuthProvider(providerId: string, credential: any): Promise<void> {
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
        throw new Error(
          `Proveedor de autenticación no soportado: ${providerId}`
        );
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

  async registerFollower(credentials: RegisterCredentials): Promise<AuthUser> {
    try {
      // Validar que Firebase esté inicializado
      if (!auth || !db) {
        console.error("[registerFollower] Firebase no está inicializado", {
          auth: !!auth,
          db: !!db,
        });
        throw new Error(
          "Error de configuración. Por favor, recarga la página e intenta nuevamente."
        );
      }

      // Validar campos requeridos
      if (!credentials.firstName || !credentials.lastName) {
        throw new Error("El nombre completo es requerido");
      }
      if (!credentials.documentNumber) {
        throw new Error("El número de documento es requerido");
      }
      if (!credentials.department || !credentials.city) {
        throw new Error("El departamento y la ciudad son requeridos");
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
            throw new Error(
              "Ya existe un usuario registrado con este número de cédula"
            );
          }
        } catch (validationError: any) {
          if (validationError.message.includes("Ya existe")) {
            throw validationError;
          }
          // Si es otro error de Firestore, loguearlo pero continuar
          console.warn(
            "[registerFollower] Error al verificar documento existente:",
            validationError
          );
        }
      }

      // Crear usuario anónimo en Firebase Auth (obtiene UID final)
      let firebaseUser: FirebaseUser;
      try {
        console.log("[registerFollower] Creando usuario anónimo...");
        const userCredential = await signInAnonymously(auth);
        firebaseUser = userCredential.user;
        console.log(
          "[registerFollower] Usuario anónimo creado:",
          firebaseUser.uid
        );
      } catch (error: any) {
        console.error("[registerFollower] Error creating anonymous user:", {
          code: error.code,
          message: error.message,
          stack: error.stack,
        });

        // Mensajes de error más específicos según el código de error de Firebase
        if (error.code === "auth/operation-not-allowed") {
          throw new Error(
            "La autenticación anónima no está habilitada en Firebase. Contacta al administrador del sistema."
          );
        } else if (error.code === "auth/admin-restricted-operation") {
          throw new Error(
            "La autenticación anónima no está habilitada en Firebase Console. Por favor, contacta al administrador para habilitar la autenticación anónima en Firebase Authentication > Sign-in method > Anonymous."
          );
        } else if (error.code === "auth/network-request-failed") {
          throw new Error(
            "Error de conexión. Verifica tu conexión a internet e intenta nuevamente."
          );
        } else if (error.code === "auth/too-many-requests") {
          throw new Error(
            "Demasiados intentos. Por favor, espera unos minutos e intenta nuevamente."
          );
        } else {
          throw new Error(
            `Error al crear cuenta: ${
              error.message || "Error desconocido"
            }. Por favor, intenta nuevamente.`
          );
        }
      }

      // Calcular fromCapitalCity y areaType
      const selectedDepartment = credentials.department;
      const selectedCity = credentials.city;
      const fromCapitalCity = credentials.fromCapitalCity ?? false;
      const areaType = credentials.areaType || "RURAL";

      // Determinar el rol
      const userRole: UserRole = "FOLLOWER";

      // Crear documento en Firestore con el UID como ID
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userData: any = {
        id: firebaseUser.uid,
        name: `${credentials.firstName} ${credentials.lastName}`,
        firstName: credentials.firstName,
        lastName: credentials.lastName,
        documentNumber: credentials.documentNumber,
        country: credentials.country,
        department: credentials.department,
        city: credentials.city,
        address: credentials.address,
        neighborhood: credentials.neighborhood,
        areaType,
        fromCapitalCity,
        role: userRole,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        pendingAuth: true, // Seguidor con autenticación anónima
      };

      // Solo incluir campos opcionales si tienen valor (no undefined)
      if (credentials.phoneNumber) {
        userData.phoneNumber = credentials.phoneNumber;
      }
      if (credentials.gender) {
        userData.gender = credentials.gender;
      }
      if (credentials.profession) {
        userData.profession = credentials.profession;
      }
      if (credentials.latitude !== undefined && credentials.latitude !== null) {
        userData.latitude = credentials.latitude;
      }
      if (
        credentials.longitude !== undefined &&
        credentials.longitude !== null
      ) {
        userData.longitude = credentials.longitude;
      }

      // Solo incluir datos de campaña/multiplicador si existen
      if (credentials.leaderId) {
        userData.leaderId = credentials.leaderId;
      }
      if (credentials.leaderName) {
        userData.leaderName = credentials.leaderName;
      }
      if (credentials.campaignId) {
        userData.campaignIds = [credentials.campaignId];
      } else {
        userData.campaignIds = [];
      }

      try {
        console.log("[registerFollower] Creando documento en Firestore...");
        await setDoc(userDocRef, userData);
        console.log(
          "[registerFollower] Documento creado exitosamente:",
          firebaseUser.uid
        );
      } catch (error: any) {
        console.error(
          "[registerFollower] Error al crear documento en Firestore:",
          {
            code: error.code,
            message: error.message,
            stack: error.stack,
            userId: firebaseUser.uid,
          }
        );

        // Si falla la creación del documento, intentar eliminar el usuario anónimo
        try {
          await firebaseUser.delete();
        } catch (deleteError) {
          console.error(
            "[registerFollower] Error al eliminar usuario anónimo después de fallo:",
            deleteError
          );
        }

        if (error.code === "permission-denied") {
          throw new Error(
            "No tienes permisos para crear la cuenta. Contacta al administrador."
          );
        } else if (error.code === "unavailable") {
          throw new Error(
            "Servicio temporalmente no disponible. Por favor, intenta nuevamente en unos momentos."
          );
        } else {
          throw new Error(
            `Error al guardar los datos: ${
              error.message || "Error desconocido"
            }. Por favor, intenta nuevamente.`
          );
        }
      }

      // Incrementar contador del multiplicador si existe
      if (credentials.leaderId) {
        try {
          const leaderDocRef = doc(db, "users", credentials.leaderId);
          await updateDoc(leaderDocRef, {
            participants: increment(1),
            updatedAt: serverTimestamp(),
          });
          console.log(
            `✅ [registerFollower] Contador de participants incrementado para multiplicador ${credentials.leaderId}`
          );
        } catch (leaderError: any) {
          console.error(
            `⚠️ [registerFollower] Error al incrementar participants del multiplicador ${credentials.leaderId}:`,
            leaderError.message
          );
        }
      }

      // Incrementar contador de la campaña si existe
      // IMPORTANTE: Siempre incrementamos cuando se registra un seguidor en una campaña
      // Los seguidores siempre son nuevos usuarios (autenticación anónima), por lo que siempre incrementamos
      if (credentials.campaignId) {
        try {
          const campaignDocRef = doc(db, "campaigns", credentials.campaignId);
          await updateDoc(campaignDocRef, {
            participants: increment(1),
            updatedAt: serverTimestamp(),
          });
          console.log(
            `✅ [registerFollower] Contador de participants incrementado para campaña ${credentials.campaignId} (Nuevo seguidor)`
          );
        } catch (campaignError: any) {
          // No fallar el registro si hay error al actualizar la campaña
          // Solo loguear el error
          console.error(
            `⚠️ [registerFollower] Error al incrementar participants de la campaña ${credentials.campaignId}:`,
            campaignError.message
          );
        }
      }

      // Obtener token de acceso
      let idToken: string;
      try {
        console.log("[registerFollower] Obteniendo token de acceso...");
        idToken = await firebaseUser.getIdToken();
        console.log("[registerFollower] Token obtenido exitosamente");
      } catch (error: any) {
        console.error("[registerFollower] Error al obtener token:", {
          code: error.code,
          message: error.message,
          stack: error.stack,
        });
        throw new Error(
          `Error al obtener token de acceso: ${
            error.message || "Error desconocido"
          }. Por favor, intenta nuevamente.`
        );
      }

      const user: User = {
        id: firebaseUser.uid,
        phoneNumber: credentials.phoneNumber || undefined,
        name: `${credentials.firstName} ${credentials.lastName}`,
        documentNumber: credentials.documentNumber,
        gender: credentials.gender,
        profession: credentials.profession,
        country: credentials.country,
        department: credentials.department,
        city: credentials.city,
        address: credentials.address,
        neighborhood: credentials.neighborhood,
        latitude: credentials.latitude,
        longitude: credentials.longitude,
        areaType,
        fromCapitalCity,
        role: userRole,
        campaignIds: credentials.campaignId ? [credentials.campaignId] : [],
        createdAt: new Date(),
      };

      if (credentials.leaderId) {
        user.leaderId = credentials.leaderId;
      }
      if (credentials.leaderName) {
        user.leaderName = credentials.leaderName;
      }

      console.log("[registerFollower] Registro completado exitosamente");
      return {
        user,
        tokens: {
          accessToken: idToken,
        },
      };
    } catch (error: any) {
      // Si el error ya tiene un mensaje específico, usarlo
      // Si no, proporcionar un mensaje genérico pero informativo
      const errorMessage =
        error.message ||
        "Error al registrar seguidor. Por favor, intenta nuevamente.";

      console.error("[registerFollower] Error completo:", {
        message: errorMessage,
        code: error.code,
        stack: error.stack,
        credentials: {
          documentNumber: credentials.documentNumber,
          firstName: credentials.firstName,
          lastName: credentials.lastName,
          hasCampaignId: !!credentials.campaignId,
          hasLeaderId: !!credentials.leaderId,
        },
      });

      throw new Error(errorMessage);
    }
  }

  async getUserByDocumentNumber(documentNumber: string): Promise<User | null> {
    try {
      if (!db) {
        throw new Error("Firestore no está inicializado");
      }

      const usersRef = collection(db, "users");
      const q = query(usersRef, where("documentNumber", "==", documentNumber));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();

      const user: User = {
        id: userDoc.id,
        email: userData.email,
        phoneNumber: userData.phoneNumber,
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
        areaType: userData.areaType,
        fromCapitalCity: userData.fromCapitalCity,
        leaderId: userData.leaderId,
        leaderName: userData.leaderName,
        campaignIds: userData.campaignIds || [],
        participants: userData.participants,
        createdAt: userData.createdAt?.toDate() || new Date(),
        preferredAuthMethod: userData.preferredAuthMethod,
        identityVerificationStatus: userData.identityVerificationStatus,
        identityVerificationAttempts: userData.identityVerificationAttempts,
        identityVerificationWorkflowId: userData.identityVerificationWorkflowId,
        isBlocked: userData.isBlocked,
      };

      return user;
    } catch (error: any) {
      console.error("Error getting user by document number:", error);
      throw new Error(
        error.message || "Error al buscar usuario por número de cédula"
      );
    }
  }

  async upgradeFollowerToMultiplier(
    userId: string,
    preferredAuthMethod?: string
  ): Promise<void> {
    try {
      if (!db) {
        throw new Error("Firestore no está inicializado");
      }

      const userDocRef = doc(db, "users", userId);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        throw new Error("Usuario no encontrado");
      }

      const updateData: any = {
        role: "MULTIPLIER" as UserRole,
        pendingAuth: false,
        updatedAt: serverTimestamp(),
      };

      if (preferredAuthMethod) {
        updateData.preferredAuthMethod = preferredAuthMethod;
      }

      await updateDoc(userDocRef, updateData);
    } catch (error: any) {
      console.error("Error upgrading follower to multiplier:", error);
      throw new Error(
        error.message || "Error al actualizar rol a multiplicador"
      );
    }
  }

  async verifyIdentity(userId: string): Promise<{ workflowId: string }> {
    try {
      if (!db) {
        throw new Error("Firestore no está inicializado");
      }

      // Importar el cliente de validación de identidad
      const { IdentityVerificationClient } = await import(
        "@/src/infrastructure/api/IdentityVerificationClient"
      );

      const client = new IdentityVerificationClient();

      if (!client.validateConfig()) {
        throw new Error("Configuración de validación de identidad incompleta");
      }

      // Obtener datos del usuario
      const userDocRef = doc(db, "users", userId);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        throw new Error("Usuario no encontrado");
      }

      const userData = userDoc.data();

      // Iniciar workflow de validación
      const verification = await client.startVerification({
        userId,
        documentNumber: userData.documentNumber,
        email: userData.email,
        phoneNumber: userData.phoneNumber,
      });

      // Actualizar usuario con workflow ID
      await updateDoc(userDocRef, {
        identityVerificationWorkflowId: verification.workflowId,
        identityVerificationStatus: "pending",
        identityVerificationAttempts:
          (userData.identityVerificationAttempts || 0) + 1,
        updatedAt: serverTimestamp(),
      });

      return {
        workflowId: verification.workflowId,
      };
    } catch (error: any) {
      console.error("Error verifying identity:", error);
      throw new Error(
        error.message || "Error al iniciar validación de identidad"
      );
    }
  }

  async checkIdentityVerificationStatus(
    workflowId: string
  ): Promise<"pending" | "verified" | "failed"> {
    try {
      // Importar el cliente de validación de identidad
      const { IdentityVerificationClient } = await import(
        "@/src/infrastructure/api/IdentityVerificationClient"
      );

      const client = new IdentityVerificationClient();

      if (!client.validateConfig()) {
        throw new Error("Configuración de validación de identidad incompleta");
      }

      const status = await client.checkStatus(workflowId);

      // Mapear estado a formato simplificado
      if (status.status === "verified") {
        return "verified";
      } else if (status.status === "failed") {
        return "failed";
      } else {
        return "pending";
      }
    } catch (error: any) {
      console.error("Error checking identity verification status:", error);
      throw new Error(
        error.message || "Error al verificar estado de validación de identidad"
      );
    }
  }
}
