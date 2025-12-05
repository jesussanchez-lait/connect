import { IAuthRepository } from "@/src/domain/repositories/IAuthRepository";
import {
  LoginCredentials,
  OtpVerification,
  OtpResponse,
  RegisterCredentials,
  PartialUserCredentials,
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

// Site key de reCAPTCHA v3
const RECAPTCHA_SITE_KEY = "6LdtfCIsAAAAAGKD9vHbGG-HBRmYTbEp17_S9xhC";

// Esperar a que reCAPTCHA v3 esté disponible
function waitForRecaptcha(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Verificar si grecaptcha está disponible
    const checkRecaptcha = () => {
      const hasRecaptcha = typeof (window as any).grecaptcha !== "undefined";

      if (hasRecaptcha) {
        console.log("✅ [DEBUG] reCAPTCHA v3 disponible");
        return true;
      }
      return false;
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
        console.log(
          "✅ [DEBUG] reCAPTCHA cargado después de",
          attempts * 100,
          "ms"
        );
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

  console.log("🔐 [DEBUG] Iniciando inicialización de reCAPTCHA...");

  // Limpiar verifier anterior si existe
  if (recaptchaVerifier) {
    try {
      console.log("🧹 [DEBUG] Limpiando verifier anterior...");
      recaptchaVerifier.clear();
    } catch (error) {
      console.warn("⚠️ [DEBUG] Error al limpiar verifier anterior:", error);
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

  console.log("✅ [DEBUG] Contenedor de reCAPTCHA encontrado");

  // Esperar a que reCAPTCHA esté disponible
  try {
    console.log("⏳ [DEBUG] Esperando a que reCAPTCHA esté disponible...");
    await waitForRecaptcha();
  } catch (error) {
    console.warn(
      "⚠️ [DEBUG] No se pudo verificar reCAPTCHA, continuando de todas formas:",
      error
    );
  }

  // Esperar un momento adicional para asegurar que el DOM está completamente cargado
  await new Promise((resolve) => setTimeout(resolve, 200));

  try {
    // Configuración de reCAPTCHA para Firebase Phone Authentication
    // IMPORTANTE: Firebase Phone Authentication usa reCAPTCHA v3 invisible internamente
    // El RecaptchaVerifier de Firebase maneja la integración con reCAPTCHA v3
    // El site key (6LdtfCIsAAAAAGKD9vHbGG-HBRmYTbEp17_S9xhC) debe estar vinculado
    // al proyecto en Firebase Console > Authentication > Settings
    console.log("🔐 [DEBUG] Creando nuevo RecaptchaVerifier...");
    console.log("🔐 [DEBUG] Auth instance:", auth);
    console.log("🔐 [DEBUG] Container ID: recaptcha-container");
    console.log("🔐 [DEBUG] reCAPTCHA Site Key:", RECAPTCHA_SITE_KEY);

    recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "invisible",
      callback: () => {
        // reCAPTCHA resuelto
        console.log("✅ [DEBUG] reCAPTCHA verificado para lait-connect");
      },
      "expired-callback": () => {
        // reCAPTCHA expirado
        console.error("❌ [DEBUG] reCAPTCHA expirado");
        recaptchaVerifier = null;
      },
    });

    console.log("✅ [DEBUG] RecaptchaVerifier creado exitosamente");

    // El reCAPTCHA se renderiza automáticamente cuando se crea el verifier
    // Esperar un momento para asegurar que esté completamente inicializado
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log("✅ [DEBUG] reCAPTCHA listo para usar");

    return recaptchaVerifier;
  } catch (error: any) {
    console.error("❌ [DEBUG] Error al inicializar reCAPTCHA:", {
      error,
      message: error.message,
      code: error.code,
      stack: error.stack,
    });

    // Si hay un error, limpiar el verifier
    if (recaptchaVerifier) {
      try {
        recaptchaVerifier.clear();
      } catch (clearError) {
        console.error(
          "Error al limpiar verifier después de error:",
          clearError
        );
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
  console.log("📞 [DEBUG] Formateando número de teléfono:", phoneNumber);

  // Remover todos los caracteres no numéricos
  const numbers = phoneNumber.replace(/\D/g, "");
  console.log(
    "📞 [DEBUG] Número sin caracteres especiales:",
    numbers,
    `(${numbers.length} dígitos)`
  );

  let formattedNumber: string;

  // Si el número ya empieza con 57 (código de país de Colombia)
  if (numbers.startsWith("57")) {
    // Verificar que tenga exactamente 12 dígitos (57 + 10 dígitos del teléfono)
    if (numbers.length === 12) {
      formattedNumber = `+${numbers}`;
      console.log(
        "✅ [DEBUG] Número ya tiene código de país 57, formato correcto:",
        formattedNumber
      );
    } else if (numbers.length > 12) {
      // Si tiene más de 12 dígitos, tomar solo los primeros 12
      formattedNumber = `+${numbers.substring(0, 12)}`;
      console.warn(
        "⚠️ [DEBUG] Número tenía más de 12 dígitos, truncado a:",
        formattedNumber
      );
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
      console.log(
        "✅ [DEBUG] Número de 10 dígitos, agregado código +57:",
        formattedNumber
      );
    } else if (numbers.length < 10) {
      throw new Error(
        `Número de teléfono inválido. Debe tener 10 dígitos. Se recibieron ${numbers.length} dígitos.`
      );
    } else {
      // Si tiene más de 10 dígitos pero no empieza con 57, podría ser un número internacional
      // Por seguridad, solo tomamos los últimos 10 dígitos y agregamos +57
      const lastTenDigits = numbers.substring(numbers.length - 10);
      formattedNumber = `+57${lastTenDigits}`;
      console.warn(
        "⚠️ [DEBUG] Número tenía más de 10 dígitos, usando últimos 10:",
        formattedNumber
      );
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

  console.log("✅ [DEBUG] Número formateado correctamente:", formattedNumber);
  return formattedNumber;
}

export class FirebaseAuthRepository implements IAuthRepository {
  async sendOtp(credentials: LoginCredentials): Promise<OtpResponse> {
    console.log("🔵 [DEBUG] sendOtp iniciado", {
      phoneNumber: credentials.phoneNumber,
    });

    try {
      if (!auth) {
        console.error("❌ [DEBUG] Firebase Auth no está inicializado");
        throw new Error("Firebase Auth no está inicializado");
      }

      console.log("✅ [DEBUG] Firebase Auth está inicializado");

      const formattedPhone = formatPhoneNumberForFirebase(
        credentials.phoneNumber
      );
      console.log("📱 [DEBUG] Número formateado:", {
        original: credentials.phoneNumber,
        formatted: formattedPhone,
      });

      // Validación final antes de enviar a Firebase
      // El número debe tener formato: +57XXXXXXXXXX (12 dígitos después del +)
      const phoneDigits = formattedPhone.replace(/\D/g, "");
      if (!formattedPhone.startsWith("+57") || phoneDigits.length !== 12) {
        const errorMsg = `Número de teléfono con formato inválido para Firebase. Esperado: +57XXXXXXXXXX (12 dígitos). Recibido: ${formattedPhone} (${phoneDigits.length} dígitos)`;
        console.error("❌ [DEBUG]", errorMsg);
        throw new Error(errorMsg);
      }

      console.log("✅ [DEBUG] Validación de formato exitosa:", {
        formato: formattedPhone,
        digitos: phoneDigits.length,
        codigoPais: formattedPhone.substring(0, 3),
        numero: formattedPhone.substring(3),
      });

      // Inicializar reCAPTCHA si no está inicializado
      console.log("🔐 [DEBUG] Inicializando reCAPTCHA...");
      const verifier = await initializeRecaptcha();
      console.log("✅ [DEBUG] reCAPTCHA inicializado correctamente");

      // Enviar código OTP
      console.log("📤 [DEBUG] Enviando código OTP a Firebase:", formattedPhone);
      console.log("📤 [DEBUG] Formato verificado: +57 seguido de 10 dígitos");

      try {
        confirmationResult = await signInWithPhoneNumber(
          auth,
          formattedPhone,
          verifier
        );
        console.log("✅ [DEBUG] Código OTP enviado exitosamente", {
          verificationId: confirmationResult.verificationId,
        });
      } catch (signInError: any) {
        console.error("❌ [DEBUG] Error al enviar código OTP:", {
          error: signInError,
          code: signInError.code,
          message: signInError.message,
        });

        // Limpiar verifier en caso de error
        if (recaptchaVerifier) {
          try {
            recaptchaVerifier.clear();
          } catch (clearError) {
            console.error("Error al limpiar verifier:", clearError);
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
        console.log(
          "🔧 [DEBUG] Modo desarrollo - verificando código OTP en emulador"
        );
        // En desarrollo, Firebase Auth emulator puede proporcionar el código
        // Por ahora, retornamos éxito sin código
        devOtpCode = undefined;
      }

      const response = {
        success: true,
        message: "Código OTP enviado exitosamente",
        otpCode: devOtpCode,
      };
      console.log("✅ [DEBUG] Respuesta final:", response);

      return response;
    } catch (error: any) {
      console.error("❌ [DEBUG] Error sending OTP:", {
        error,
        message: error.message,
        code: error.code,
        stack: error.stack,
      });

      return {
        success: false,
        message:
          error.message || "Error al enviar código OTP. Intenta nuevamente.",
      };
    }
  }

  async verifyOtp(verification: OtpVerification): Promise<AuthUser> {
    console.log("🔵 [DEBUG] verifyOtp iniciado", {
      phoneNumber: verification.phoneNumber,
      otpCodeLength: verification.otpCode.length,
    });

    try {
      if (!confirmationResult) {
        console.error("❌ [DEBUG] No hay confirmationResult pendiente");
        throw new Error(
          "No hay una verificación pendiente. Por favor, solicita un nuevo código."
        );
      }

      console.log("✅ [DEBUG] confirmationResult encontrado", {
        verificationId: confirmationResult.verificationId,
      });

      if (!auth) {
        console.error("❌ [DEBUG] Firebase Auth no está inicializado");
        throw new Error("Firebase Auth no está inicializado");
      }

      console.log("🔐 [DEBUG] Verificando código OTP:", {
        code: verification.otpCode,
        phoneNumber: verification.phoneNumber,
      });

      // Verificar el código OTP
      const userCredential = await confirmationResult.confirm(
        verification.otpCode
      );
      const firebaseUser = userCredential.user;
      console.log("✅ [DEBUG] Código OTP verificado exitosamente", {
        uid: firebaseUser.uid,
        phoneNumber: firebaseUser.phoneNumber,
      });

      // Limpiar el confirmationResult
      confirmationResult = null;
      console.log("🧹 [DEBUG] confirmationResult limpiado");

      // Obtener o crear el documento del usuario en Firestore
      console.log("📄 [DEBUG] Obteniendo datos del usuario de Firestore...", {
        uid: firebaseUser.uid,
      });
      const userDocRef = doc(db!, "users", firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      let user: User;

      if (userDoc.exists()) {
        console.log("✅ [DEBUG] Usuario existe en Firestore");
        // Usuario existe, obtener datos de Firestore
        const userData = userDoc.data();
        console.log("📋 [DEBUG] Datos del usuario:", userData);
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
        console.log("🆕 [DEBUG] Usuario nuevo, creando documento básico");
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
        console.log("✅ [DEBUG] Documento de usuario creado en Firestore");

        user = newUser;
      }

      // Obtener el token de acceso
      console.log("🔑 [DEBUG] Obteniendo token de acceso...");
      const idToken = await firebaseUser.getIdToken();
      console.log("✅ [DEBUG] Token obtenido (longitud):", idToken.length);

      const authUser: AuthUser = {
        user,
        tokens: {
          accessToken: idToken,
        },
      };

      console.log("✅ [DEBUG] verifyOtp completado exitosamente", {
        userId: user.id,
        userName: user.name,
      });

      return authUser;
    } catch (error: any) {
      console.error("❌ [DEBUG] Error verifying OTP:", {
        error,
        message: error.message,
        code: error.code,
        stack: error.stack,
      });
      confirmationResult = null;
      throw new Error(
        error.message || "Código OTP inválido. Por favor, intenta nuevamente."
      );
    }
  }

  async createPartialUser(credentials: PartialUserCredentials): Promise<void> {
    console.log(
      "📝 [REGISTRO] Iniciando creación de usuario parcial en Firestore"
    );
    console.log("📝 [REGISTRO] Datos recibidos:", {
      firstName: credentials.firstName,
      lastName: credentials.lastName,
      documentNumber: credentials.documentNumber,
      phoneNumber: credentials.phoneNumber,
      leaderId: credentials.leaderId,
      leaderName: credentials.leaderName,
      campaignId: credentials.campaignId,
    });

    try {
      if (!db) {
        console.error("❌ [REGISTRO] Firestore no está inicializado");
        throw new Error("Firestore no está inicializado");
      }

      // Si hay usuario autenticado, usar su UID, si no, usar el teléfono como ID temporal
      let userId: string;
      let isAuthenticated = false;

      if (auth && auth.currentUser) {
        userId = auth.currentUser.uid;
        isAuthenticated = true;
        console.log("✅ [REGISTRO] Usuario autenticado en Firebase Auth:", {
          uid: userId,
          phoneNumber: auth.currentUser.phoneNumber,
        });
      } else {
        // Usar el teléfono como ID temporal antes de autenticar
        userId = credentials.phoneNumber.replace(/\D/g, "");
        console.log(
          "📝 [REGISTRO] Usuario no autenticado, usando teléfono como ID temporal:",
          userId
        );
      }

      // Verificar si el documento de identidad ya existe
      if (credentials.documentNumber) {
        try {
          console.log(
            "🔍 [REGISTRO] Verificando si existe usuario con cédula:",
            credentials.documentNumber
          );
          const usersRef = collection(db, "users");
          const q = query(
            usersRef,
            where("documentNumber", "==", credentials.documentNumber)
          );
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            // Verificar que no sea el mismo usuario
            const existingUser = querySnapshot.docs[0];
            console.log("⚠️ [REGISTRO] Usuario encontrado con misma cédula:", {
              existingUserId: existingUser.id,
              currentUserId: userId,
            });
            if (existingUser.id !== userId) {
              console.error(
                "❌ [REGISTRO] Ya existe otro usuario con esta cédula"
              );
              throw new Error(
                "Ya existe un usuario registrado con este número de cédula"
              );
            }
            console.log("✅ [REGISTRO] Es el mismo usuario, continuando...");
          } else {
            console.log(
              "✅ [REGISTRO] No existe usuario con esta cédula, puede continuar"
            );
          }
        } catch (validationError: any) {
          console.error("❌ [REGISTRO] Error al verificar cédula duplicada:", {
            error: validationError.message,
            code: validationError.code,
            stack: validationError.stack,
            documentNumber: credentials.documentNumber,
          });
          // Re-lanzar el error si es de validación de duplicado
          if (validationError.message.includes("Ya existe")) {
            throw validationError;
          }
          // Si es otro error, solo loguearlo pero continuar
          console.warn(
            "⚠️ [REGISTRO] Continuando a pesar del error de validación"
          );
        }
      }

      // Crear o actualizar el documento del usuario en Firestore con datos parciales
      const userDocRef = doc(db, "users", userId);
      const userData: any = {
        id: userId,
        phoneNumber:
          isAuthenticated && auth && auth.currentUser?.phoneNumber
            ? auth.currentUser.phoneNumber
            : credentials.phoneNumber,
        name: `${credentials.firstName} ${credentials.lastName}`,
        firstName: credentials.firstName,
        lastName: credentials.lastName,
        documentNumber: credentials.documentNumber,
        leaderId: credentials.leaderId,
        leaderName: credentials.leaderName,
        campaignId: credentials.campaignId,
        role: "FOLLOWER" as UserRole, // Rol por defecto para nuevos usuarios
        updatedAt: serverTimestamp(),
        // Si no está autenticado, marcar como pendiente
        pendingAuth: !isAuthenticated,
      };

      // Si está autenticado, establecer createdAt si es nuevo
      try {
        if (isAuthenticated) {
          console.log("🔍 [REGISTRO] Verificando si el documento ya existe...");
          const existingDoc = await getDoc(userDocRef);
          if (!existingDoc.exists()) {
            console.log(
              "🆕 [REGISTRO] Documento nuevo, estableciendo createdAt"
            );
            userData.createdAt = serverTimestamp();
          } else {
            console.log(
              "🔄 [REGISTRO] Documento existente, preservando createdAt"
            );
          }
        } else {
          // Si no está autenticado, establecer createdAt para el documento temporal
          console.log(
            "📝 [REGISTRO] Usuario no autenticado, estableciendo createdAt"
          );
          userData.createdAt = serverTimestamp();
        }
      } catch (checkError: any) {
        console.error("❌ [REGISTRO] Error al verificar documento existente:", {
          error: checkError.message,
          code: checkError.code,
          stack: checkError.stack,
          userId,
        });
        // Continuar y establecer createdAt de todas formas
        userData.createdAt = serverTimestamp();
      }

      console.log("💾 [REGISTRO] Guardando usuario en Firestore:", {
        collection: "users",
        documentId: userId,
        isAuthenticated,
        data: {
          ...userData,
          createdAt: userData.createdAt
            ? "[serverTimestamp]"
            : "[no establecido]",
          updatedAt: "[serverTimestamp]",
        },
      });

      // Usar merge: true para actualizar solo los campos proporcionados
      try {
        await setDoc(userDocRef, userData, { merge: true });
        console.log("✅ [REGISTRO] setDoc ejecutado exitosamente");
      } catch (setDocError: any) {
        console.error("❌ [REGISTRO] Error al ejecutar setDoc:", {
          error: setDocError.message,
          code: setDocError.code,
          stack: setDocError.stack,
          userId,
          collection: "users",
          dataKeys: Object.keys(userData),
        });
        throw setDocError;
      }

      console.log(
        "✅ [REGISTRO] Usuario parcial creado/actualizado exitosamente en Firestore"
      );
      console.log("✅ [REGISTRO] Detalles del usuario guardado:", {
        userId,
        name: userData.name,
        documentNumber: userData.documentNumber,
        phoneNumber: userData.phoneNumber,
        leaderId: userData.leaderId,
        leaderName: userData.leaderName,
        campaignId: userData.campaignId,
        role: userData.role,
        isAuthenticated,
        pendingAuth: !isAuthenticated,
      });

      // Si no estaba autenticado y ahora sí lo está, mover el documento al UID real
      if (!isAuthenticated && auth && auth.currentUser) {
        const realUserId = auth.currentUser.uid;
        if (realUserId !== userId) {
          console.log(
            "🔄 [REGISTRO] Moviendo documento temporal al UID real:",
            {
              from: userId,
              to: realUserId,
            }
          );
          const realUserDocRef = doc(db, "users", realUserId);
          await setDoc(
            realUserDocRef,
            {
              ...userData,
              id: realUserId,
              phoneNumber:
                auth.currentUser.phoneNumber || credentials.phoneNumber,
              pendingAuth: false,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );

          // Eliminar el documento temporal
          const tempUserDocRef = doc(db, "users", userId);
          await setDoc(tempUserDocRef, { deleted: true }, { merge: true });
          console.log(
            "✅ [REGISTRO] Documento movido al UID real exitosamente"
          );
        }
      }
    } catch (error: any) {
      console.error("❌ [REGISTRO] Error al crear usuario parcial:", {
        error: error.message,
        code: error.code,
        stack: error.stack,
      });
      throw new Error(
        error.message ||
          "Error al crear usuario. Por favor, intenta nuevamente."
      );
    }
  }

  async register(credentials: RegisterCredentials): Promise<AuthUser> {
    console.log("📝 [REGISTRO] Iniciando registro completo de usuario");
    console.log("📝 [REGISTRO] Datos completos recibidos:", {
      firstName: credentials.firstName,
      lastName: credentials.lastName,
      documentNumber: credentials.documentNumber,
      phoneNumber: credentials.phoneNumber,
      country: credentials.country,
      department: credentials.department,
      city: credentials.city,
      neighborhood: credentials.neighborhood,
      latitude: credentials.latitude,
      longitude: credentials.longitude,
      leaderId: credentials.leaderId,
      leaderName: credentials.leaderName,
      campaignId: credentials.campaignId,
    });

    try {
      if (!auth) {
        console.error("❌ [REGISTRO] Firebase Auth no está inicializado");
        throw new Error("Firebase Auth no está inicializado");
      }

      if (!auth.currentUser) {
        console.error("❌ [REGISTRO] No hay usuario autenticado");
        throw new Error(
          "Debes verificar tu número de teléfono primero. Por favor, inicia sesión."
        );
      }

      const firebaseUser = auth.currentUser;
      console.log("✅ [REGISTRO] Usuario autenticado:", {
        uid: firebaseUser.uid,
        phoneNumber: firebaseUser.phoneNumber,
      });

      // Verificar si el documento de identidad ya existe
      if (credentials.documentNumber) {
        try {
          console.log(
            "🔍 [REGISTRO] Verificando duplicados de cédula:",
            credentials.documentNumber
          );
          const usersRef = collection(db!, "users");
          const q = query(
            usersRef,
            where("documentNumber", "==", credentials.documentNumber)
          );
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            // Verificar que no sea el mismo usuario
            const existingUser = querySnapshot.docs[0];
            console.log("⚠️ [REGISTRO] Usuario encontrado con misma cédula:", {
              existingUserId: existingUser.id,
              currentUserId: firebaseUser.uid,
            });
            if (existingUser.id !== firebaseUser.uid) {
              console.error("❌ [REGISTRO] Cédula duplicada detectada");
              throw new Error(
                "Ya existe un usuario registrado con este número de cédula"
              );
            }
            console.log("✅ [REGISTRO] Es el mismo usuario, continuando...");
          }
        } catch (validationError: any) {
          console.error("❌ [REGISTRO] Error al verificar cédula duplicada:", {
            error: validationError.message,
            code: validationError.code,
            stack: validationError.stack,
            documentNumber: credentials.documentNumber,
          });
          // Re-lanzar el error si es de validación de duplicado
          if (validationError.message.includes("Ya existe")) {
            throw validationError;
          }
          // Si es otro error, solo loguearlo pero continuar
          console.warn(
            "⚠️ [REGISTRO] Continuando a pesar del error de validación"
          );
        }
      }

      // Crear o actualizar el documento del usuario en Firestore
      const userDocRef = doc(db!, "users", firebaseUser.uid);

      // Verificar si el usuario ya existe para no sobrescribir createdAt
      let userExists = false;
      try {
        console.log(
          "🔍 [REGISTRO] Verificando si usuario ya existe en Firestore"
        );
        const existingUserDoc = await getDoc(userDocRef);
        userExists = existingUserDoc.exists();
        console.log("📊 [REGISTRO] Estado del usuario:", {
          exists: userExists,
          uid: firebaseUser.uid,
        });
      } catch (checkError: any) {
        console.error("❌ [REGISTRO] Error al verificar usuario existente:", {
          error: checkError.message,
          code: checkError.code,
          stack: checkError.stack,
          uid: firebaseUser.uid,
        });
        // Continuar asumiendo que es nuevo
        userExists = false;
      }

      const userData: any = {
        id: firebaseUser.uid,
        phoneNumber: firebaseUser.phoneNumber || credentials.phoneNumber,
        name: `${credentials.firstName} ${credentials.lastName}`,
        firstName: credentials.firstName,
        lastName: credentials.lastName,
        documentNumber: credentials.documentNumber,
        country: credentials.country,
        department: credentials.department,
        city: credentials.city,
        address: credentials.address,
        neighborhood: credentials.neighborhood,
        latitude: credentials.latitude || null,
        longitude: credentials.longitude || null,
        leaderId: credentials.leaderId,
        leaderName: credentials.leaderName,
        campaignId: credentials.campaignId,
        role: "FOLLOWER" as UserRole, // Rol por defecto para nuevos usuarios
        updatedAt: serverTimestamp(),
      };

      // Solo establecer createdAt si el usuario no existe
      if (!userExists) {
        console.log("🆕 [REGISTRO] Usuario nuevo, estableciendo createdAt");
        userData.createdAt = serverTimestamp();
      } else {
        console.log("🔄 [REGISTRO] Usuario existente, preservando createdAt");
      }

      console.log(
        "💾 [REGISTRO] Actualizando usuario en Firestore con datos completos:",
        {
          collection: "users",
          documentId: firebaseUser.uid,
          isNewUser: !userExists,
          data: {
            ...userData,
            createdAt: userExists ? "[preservado]" : "[serverTimestamp]",
            updatedAt: "[serverTimestamp]",
          },
        }
      );

      try {
        await setDoc(userDocRef, userData, { merge: true });
        console.log("✅ [REGISTRO] setDoc ejecutado exitosamente en register");
      } catch (setDocError: any) {
        console.error("❌ [REGISTRO] Error al ejecutar setDoc en register:", {
          error: setDocError.message,
          code: setDocError.code,
          stack: setDocError.stack,
          uid: firebaseUser.uid,
          collection: "users",
          dataKeys: Object.keys(userData),
        });
        throw setDocError;
      }

      console.log(
        "✅ [REGISTRO] Usuario actualizado exitosamente en Firestore"
      );

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

      console.log("🔑 [REGISTRO] Obteniendo token de acceso");
      // Obtener el token de acceso
      const idToken = await firebaseUser.getIdToken();
      console.log("✅ [REGISTRO] Token obtenido exitosamente");

      const authUser = {
        user,
        tokens: {
          accessToken: idToken,
        },
      };

      console.log("✅ [REGISTRO] Registro completo exitoso:", {
        userId: user.id,
        userName: user.name,
        role: user.role,
        hasToken: !!authUser.tokens.accessToken,
      });

      return authUser;
    } catch (error: any) {
      console.error("❌ [REGISTRO] Error en registro completo:", {
        error: error.message,
        code: error.code,
        stack: error.stack,
      });
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
