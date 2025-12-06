"use client";

import { useState, FormEvent, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  registerUseCase,
  sendOtpUseCase,
  verifyOtpUseCase,
  createPartialUserUseCase,
} from "@/src/shared/di/container";
import {
  RegisterCredentials,
  OtpVerification,
} from "@/src/domain/entities/AuthCredentials";
import { useColombiaData } from "@/src/presentation/hooks/useColombiaData";
import {
  validateColombianId,
  formatColombianId,
} from "@/src/shared/utils/validation";
import { Stepper } from "@/src/presentation/components/ui/Stepper";
import {
  Loader,
  LoaderWithText,
} from "@/src/presentation/components/ui/Loader";
import { HabeasDataCheckbox } from "@/src/presentation/components/legal/HabeasDataCheckbox";
import { WhatsAppConsentCheckbox } from "@/src/presentation/components/legal/WhatsAppConsentCheckbox";
import { loadGoogleMaps } from "@/src/infrastructure/api/GoogleMapsLoader";

// Función para formatear número de teléfono al formato (xxx)-xxx-xxxx
function formatPhoneNumber(value: string): string {
  const numbers = value.replace(/\D/g, "");
  const limitedNumbers = numbers.slice(0, 10);

  if (limitedNumbers.length === 0) return "";
  if (limitedNumbers.length <= 3) return `(${limitedNumbers}`;
  if (limitedNumbers.length <= 6) {
    return `(${limitedNumbers.slice(0, 3)})-${limitedNumbers.slice(3)}`;
  }
  return `(${limitedNumbers.slice(0, 3)})-${limitedNumbers.slice(
    3,
    6
  )}-${limitedNumbers.slice(6)}`;
}

// Función para normalizar número de teléfono (solo dígitos)
function normalizePhoneNumber(value: string): string {
  return value.replace(/\D/g, "");
}

interface RegisterFormProps {
  leaderId: string;
  leaderName: string;
  campaignId: string;
}

export function RegisterForm({
  leaderId,
  leaderName,
  campaignId,
}: RegisterFormProps) {
  const router = useRouter();
  const {
    departments,
    cities,
    loadingDepartments,
    loadingCities,
    loadCitiesByDepartment,
  } = useColombiaData();

  // Datos personales
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [documentNumberDisplay, setDocumentNumberDisplay] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneNumberDisplay, setPhoneNumberDisplay] = useState("");

  // Datos territoriales
  const [country, setCountry] = useState("Colombia");
  const [departmentId, setDepartmentId] = useState<string>("");
  const [cityId, setCityId] = useState<string>("");
  const [address, setAddress] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [mapError, setMapError] = useState<string>("");

  // Referencias para Google Places Autocomplete
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const addressInputRef = useRef<HTMLInputElement | null>(null);
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Consentimientos legales
  const [habeasDataConsent, setHabeasDataConsent] = useState(false);
  const [whatsAppConsent, setWhatsAppConsent] = useState(false);
  const [habeasDataError, setHabeasDataError] = useState("");
  const [whatsAppError, setWhatsAppError] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingPreResiger, setLoadingPreResiger] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);

  const steps = [
    "Datos Personales",
    "Verificación de Teléfono",
    "Datos Territoriales",
  ];

  // Cargar ciudades cuando se selecciona un departamento
  useEffect(() => {
    if (departmentId) {
      loadCitiesByDepartment(Number(departmentId));
      setCityId(""); // Resetear ciudad cuando cambia el departamento
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departmentId]);

  // Inicializar Google Places Autocomplete solo cuando estemos en el paso 3
  useEffect(() => {
    if (currentStep !== 3 || !googleMapsApiKey) {
      return;
    }

    let isMounted = true;

    // Función para inicializar autocomplete cuando Google Maps esté listo
    const initAutocomplete = (google: typeof window.google) => {
      if (!isMounted || !addressInputRef.current) {
        console.warn("⚠️ [REGISTRO] Input ref o componente no montado");
        return;
      }

      // Verificar que Places está disponible
      if (!google.maps?.places) {
        console.error("❌ [REGISTRO] Places library no está disponible");
        if (isMounted) {
          setMapError(
            "La biblioteca de Places no está disponible. Por favor, ingresa tu dirección manualmente."
          );
        }
        return;
      }

      // Verificar que Autocomplete está disponible
      if (!google.maps.places.Autocomplete) {
        console.error(
          "❌ [REGISTRO] Autocomplete no está disponible en Places"
        );
        if (isMounted) {
          setMapError(
            "El autocompletado no está disponible. Por favor, ingresa tu dirección manualmente."
          );
        }
        return;
      }

      // Limpiar autocomplete anterior si existe
      if (autocompleteRef.current) {
        // La API tradicional de Autocomplete no tiene método remove explícito,
        // pero podemos limpiar los listeners si es necesario
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }

      // Crear nuevo autocomplete usando la API tradicional
      try {
        const input = addressInputRef.current;
        const options: google.maps.places.AutocompleteOptions = {
          componentRestrictions: { country: "co" }, // Restringir a Colombia
          types: ["geocode"], // Solo direcciones geocodificadas
          fields: ["formatted_address", "geometry", "name"], // Campos que necesitamos
        };

        autocompleteRef.current = new google.maps.places.Autocomplete(
          input,
          options
        );

        // Listener para cuando se selecciona una dirección
        autocompleteRef.current.addListener("place_changed", () => {
          if (!isMounted) return;

          try {
            const place = autocompleteRef.current?.getPlace();
            if (place && place.geometry && place.geometry.location) {
              const location = place.geometry.location;

              // Obtener la dirección formateada
              const formattedAddress =
                place.formatted_address || place.name || input.value || "";

              // Actualizar el estado con la dirección seleccionada
              setAddress(formattedAddress);

              // Obtener coordenadas (puede ser LatLng o LatLngLiteral)
              if (typeof location.lat === "function") {
                setLatitude(location.lat());
                setLongitude(location.lng());
              } else {
                setLatitude(location.lat);
                setLongitude(location.lng);
              }

              setMapError("");
              console.log("📍 [REGISTRO] Dirección seleccionada:", {
                address: formattedAddress,
                lat:
                  typeof location.lat === "function"
                    ? location.lat()
                    : location.lat,
                lng:
                  typeof location.lng === "function"
                    ? location.lng()
                    : location.lng,
              });
            }
          } catch (error) {
            console.error(
              "❌ [REGISTRO] Error al procesar lugar seleccionado:",
              error
            );
          }
        });

        console.log(
          "✅ [REGISTRO] Google Places Autocomplete inicializado correctamente"
        );
      } catch (error) {
        console.error("❌ [REGISTRO] Error al crear Autocomplete:", error);
        if (isMounted) {
          setMapError(
            "Error al inicializar el autocompletado. Por favor, ingresa tu dirección manualmente."
          );
        }
      }
    };

    // Cargar Google Maps usando el loader
    loadGoogleMaps()
      .then((google) => {
        if (!isMounted) return;

        // Verificar que Places está cargado
        if (!google.maps?.places) {
          console.error(
            "❌ [REGISTRO] Places library no se cargó correctamente"
          );
          if (isMounted) {
            setMapError(
              "No se pudo cargar la biblioteca de Places. Por favor, ingresa tu dirección manualmente."
            );
          }
          return;
        }

        // Pequeño delay para asegurar que el input esté renderizado
        setTimeout(() => {
          if (isMounted && addressInputRef.current) {
            initAutocomplete(google);
          } else {
            console.warn("⚠️ [REGISTRO] Input no disponible después del delay");
          }
        }, 200);
      })
      .catch((error) => {
        console.error("❌ [REGISTRO] Error al cargar Google Maps:", error);
        if (isMounted) {
          setMapError(
            "No se pudo cargar el autocompletado de direcciones. Por favor, ingresa tu dirección manualmente."
          );
        }
      });

    // Cleanup
    return () => {
      isMounted = false;
      if (autocompleteRef.current && window.google?.maps?.event) {
        try {
          // Limpiar listeners del autocomplete
          window.google.maps.event.clearInstanceListeners(
            autocompleteRef.current
          );
        } catch (e) {
          console.warn("Error en cleanup:", e);
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleMapsApiKey, currentStep]); // Re-inicializar cuando cambie el paso

  // Obtener geolocalización
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMapError("La geolocalización no está disponible en tu navegador");
      return;
    }

    setMapError("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
      },
      (error) => {
        setMapError("Error al obtener tu ubicación: " + error.message);
      }
    );
  };

  // Validar paso 1
  const validateStep1 = (): boolean => {
    return (
      firstName.trim() !== "" &&
      lastName.trim() !== "" &&
      validateColombianId(documentNumber) &&
      normalizePhoneNumber(phoneNumber).length >= 10
    );
  };

  // Validar paso 3 (Datos Territoriales)
  const validateStep3 = (): boolean => {
    const hasDepartment =
      departmentId !== "" &&
      departmentId !== null &&
      departmentId !== undefined;
    const hasCity = cityId !== "" && cityId !== null && cityId !== undefined;
    const hasAddress = address.trim() !== "";
    console.log("address::: ", address);
    const hasNeighborhood = neighborhood.trim() !== "";
    const hasHabeasData = habeasDataConsent === true;
    const hasWhatsApp = whatsAppConsent === true;

    const isValid =
      hasDepartment &&
      hasCity &&
      hasAddress &&
      hasNeighborhood &&
      hasHabeasData &&
      hasWhatsApp;

    // Log de depuración solo en desarrollo
    if (process.env.NODE_ENV === "development" && currentStep === 3) {
      console.log("🔍 [REGISTRO] Validación paso 3:", {
        hasDepartment,
        hasCity,
        hasAddress,
        hasNeighborhood,
        hasHabeasData,
        hasWhatsApp,
        isValid,
        values: {
          departmentId,
          cityId,
          address: address.trim(),
          neighborhood: neighborhood.trim(),
          habeasDataConsent,
          whatsAppConsent,
        },
      });
    }

    return isValid;
  };

  const handlePreRegisterUser = async () => {
    const normalizedPhone = normalizePhoneNumber(phoneNumber);

    // PASO 1: Crear usuario parcial en Firestore (sin autenticación aún)
    console.log(
      "💾 [REGISTRO] PASO 1: Creando usuario parcial en Firestore (sin autenticación)"
    );
    setLoadingPreResiger(true);
    try {
      const partialUserData = {
        firstName,
        lastName,
        documentNumber: documentNumber.replace(/\D/g, ""),
        phoneNumber: normalizedPhone,
        leaderId,
        leaderName,
        campaignId,
      };
      console.log("📋 [REGISTRO] Datos del paso 1 a guardar:", partialUserData);

      await createPartialUserUseCase.execute(partialUserData);
      console.log(
        "✅ [REGISTRO] PASO 1 COMPLETADO: Usuario parcial creado en Firestore con ID temporal (teléfono)"
      );
      setLoadingPreResiger(false);
    } catch (partialUserError: any) {
      console.error("❌ [REGISTRO] Error al guardar datos del paso 1:", {
        error: partialUserError,
        message: partialUserError?.message || "Error desconocido",
        code: partialUserError?.code,
        stack: partialUserError?.stack,
        data: {
          firstName,
          lastName,
          documentNumber: documentNumber.replace(/\D/g, ""),
          phoneNumber: normalizedPhone,
          leaderId,
          leaderName,
          campaignId,
        },
      });
      // Continuar con el envío del OTP aunque falle el guardado parcial
      // El registro completo se hará después de verificar el OTP
      console.warn(
        "⚠️ [REGISTRO] Continuando con envío de OTP a pesar del error"
      );
      setLoadingPreResiger(false);
    }
  };

  // Enviar OTP para verificación de teléfono
  const handleSendOtp = async () => {
    console.log("📱 [REGISTRO] Iniciando envío de código OTP");
    console.log("📋 [REGISTRO] Datos del paso 1:", {
      firstName,
      lastName,
      documentNumber: documentNumber.replace(/\D/g, ""),
      phoneNumber: normalizePhoneNumber(phoneNumber),
      leaderId,
      leaderName,
      campaignId,
    });

    setError("");
    setLoading(true);

    try {
      const normalizedPhone = normalizePhoneNumber(phoneNumber);

      console.log("📤 [REGISTRO] Enviando OTP al número:", normalizedPhone);
      let response;
      try {
        response = await sendOtpUseCase.execute({
          phoneNumber: normalizedPhone,
        });
        console.log("✅ [REGISTRO] Respuesta de sendOtpUseCase:", response);
      } catch (otpError: any) {
        console.error("❌ [REGISTRO] Error al ejecutar sendOtpUseCase:", {
          error: otpError,
          message: otpError?.message || "Error desconocido",
          code: otpError?.code,
          stack: otpError?.stack,
          phoneNumber: normalizedPhone,
        });
        throw otpError;
      }

      if (response.success) {
        console.log("✅ [REGISTRO] Código OTP enviado exitosamente");
        setOtpSent(true);
        setCurrentStep(2);
        console.log("✅ [REGISTRO] Avanzando al paso 2 (Verificación de OTP)");
      } else {
        console.error("❌ [REGISTRO] Error al enviar OTP:", {
          success: response.success,
          message: response.message,
          response,
        });
        setError(response.message || "Error al enviar código OTP");
      }
    } catch (err: any) {
      console.error("❌ [REGISTRO] Excepción completa al enviar OTP:", {
        error: err,
        message: err?.message || "Error desconocido",
        code: err?.code,
        stack: err?.stack,
        name: err?.name,
        phoneNumber: normalizePhoneNumber(phoneNumber),
      });
      setError(
        err instanceof Error ? err.message : "Error al enviar código OTP"
      );
    } finally {
      setLoading(false);
    }
  };

  // Verificar OTP
  const handleVerifyOtp = async () => {
    console.log("🔐 [REGISTRO] Iniciando verificación de OTP");
    setError("");
    setLoading(true);

    try {
      const normalizedPhone = normalizePhoneNumber(phoneNumber);
      const verification: OtpVerification = {
        phoneNumber: normalizedPhone,
        otpCode,
      };

      console.log("📱 [REGISTRO] Verificando código OTP:", {
        phoneNumber: normalizedPhone,
        otpCodeLength: otpCode.length,
        otpCode: otpCode,
      });

      // PASO 2: Verificar el código OTP y autenticar en Firebase Auth
      console.log(
        "🔐 [REGISTRO] PASO 2: Verificando OTP y autenticando en Firebase Auth"
      );
      let verifyResult;
      try {
        verifyResult = await verifyOtpUseCase.execute(verification);
        console.log(
          "✅ [REGISTRO] PASO 2 COMPLETADO: Usuario autenticado en Firebase Auth:",
          {
            userId: verifyResult?.user?.id,
            userName: verifyResult?.user?.name,
            hasToken: !!verifyResult?.tokens?.accessToken,
            phoneNumber: verifyResult?.user?.phoneNumber,
          }
        );
      } catch (verifyError: any) {
        console.error("❌ [REGISTRO] Error al verificar OTP:", {
          error: verifyError,
          message: verifyError?.message || "Error desconocido",
          code: verifyError?.code,
          stack: verifyError?.stack,
          phoneNumber: normalizedPhone,
          otpCodeLength: otpCode.length,
        });
        throw verifyError;
      }

      // Después de autenticar, actualizar el documento temporal con el UID real
      // El documento parcial fue creado en el paso 1 con ID temporal (teléfono)
      // Ahora lo actualizamos con el UID real del usuario autenticado
      console.log(
        "🔄 [REGISTRO] PASO 2: Actualizando documento temporal con UID real de autenticación"
      );
      try {
        const partialUserData = {
          firstName,
          lastName,
          documentNumber: documentNumber.replace(/\D/g, ""),
          phoneNumber: normalizedPhone,
          leaderId,
          leaderName,
          campaignId,
        };
        console.log(
          "📋 [REGISTRO] Datos del paso 1 a actualizar con UID real:",
          partialUserData
        );

        // Esto actualizará el documento con el UID real del usuario autenticado
        // Si había un documento temporal con ID de teléfono, lo moverá al UID real
        try {
          await createPartialUserUseCase.execute(partialUserData);
          console.log(
            "✅ [REGISTRO] PASO 2 COMPLETADO: Usuario actualizado en Firestore con UID real"
          );
        } catch (partialUserError: any) {
          console.error(
            "❌ [REGISTRO] Error al actualizar usuario con UID real:",
            {
              error: partialUserError,
              message: partialUserError?.message || "Error desconocido",
              code: partialUserError?.code,
              stack: partialUserError?.stack,
              data: partialUserData,
            }
          );
          // No bloqueamos el flujo si falla la actualización,
          // el registro completo se hará en el paso 3
          console.warn(
            "⚠️ [REGISTRO] Continuando al paso 3 a pesar del error de actualización"
          );
        }
      } catch (updateError: any) {
        console.error("❌ [REGISTRO] Error en bloque de actualización:", {
          error: updateError,
          message: updateError?.message || "Error desconocido",
          code: updateError?.code,
          stack: updateError?.stack,
        });
        // Continuar de todas formas al paso 3
      }

      setPhoneVerified(true);
      setCurrentStep(3);
      setError("");
      console.log("✅ [REGISTRO] Paso 2 completado, avanzando al paso 3");
    } catch (err: any) {
      console.error("❌ [REGISTRO] Error completo en verificación de OTP:", {
        error: err,
        message: err?.message || "Error desconocido",
        code: err?.code,
        stack: err?.stack,
        name: err?.name,
        phoneNumber: normalizePhoneNumber(phoneNumber),
        otpCodeLength: otpCode.length,
      });
      setError(err instanceof Error ? err.message : "Código OTP inválido");
    } finally {
      setLoading(false);
    }
  };

  // Avanzar al siguiente paso
  const handleNextStep = async () => {
    console.log("ON NEXT STEP FORM 1");
    if (currentStep === 1 && validateStep1()) {
      await handlePreRegisterUser();
      // await handleSendOtp();
    }
  };

  // Volver al paso anterior
  const handlePreviousStep = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
      setOtpSent(false);
      setOtpCode("");
      setError("");
    } else if (currentStep === 3) {
      setCurrentStep(2);
      setError("");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    console.log("📝 [REGISTRO] Iniciando envío del formulario completo");
    setError("");
    setLoading(true);

    // Validar todos los campos antes de enviar
    if (!validateStep1() || !validateStep3()) {
      console.warn("⚠️ [REGISTRO] Validación fallida:", {
        step1Valid: validateStep1(),
        step3Valid: validateStep3(),
        departmentId,
        cityId,
        address: address.trim(),
        neighborhood: neighborhood.trim(),
        habeasDataConsent,
        whatsAppConsent,
      });
      if (!habeasDataConsent) {
        setHabeasDataError("Debes aceptar la política de tratamiento de datos");
      }
      if (!whatsAppConsent) {
        setWhatsAppError("Debes aceptar el consentimiento de WhatsApp");
      }
      setError(
        "Por favor completa todos los campos requeridos y acepta los consentimientos"
      );
      setLoading(false);
      return;
    }

    try {
      const normalizedPhone = normalizePhoneNumber(phoneNumber);
      const selectedDepartment = departments.find(
        (d) => d.id.toString() === departmentId
      );
      const selectedCity = cities.find((c) => c.id.toString() === cityId);

      const credentials: RegisterCredentials = {
        firstName,
        lastName,
        documentNumber: documentNumber.replace(/\D/g, ""),
        phoneNumber: normalizedPhone,
        country,
        department: selectedDepartment?.name || "",
        city: selectedCity?.name || "",
        address: address, // Dirección completa
        neighborhood: neighborhood, // Barrio
        latitude,
        longitude,
        leaderId,
        leaderName,
        campaignId,
      };

      console.log("📋 [REGISTRO] Datos completos del formulario:", {
        ...credentials,
        departmentId,
        cityId,
        selectedDepartment: selectedDepartment?.name,
        selectedCity: selectedCity?.name,
      });

      // PASO 3: Actualizar usuario con datos territoriales completos
      console.log(
        "💾 [REGISTRO] PASO 3: Actualizando usuario con datos territoriales completos"
      );
      let result;
      try {
        result = await registerUseCase.execute(credentials);
        console.log(
          "✅ [REGISTRO] PASO 3 COMPLETADO: Usuario actualizado con datos territoriales:",
          {
            userId: result?.user?.id,
            userName: result?.user?.name,
            hasToken: !!result?.tokens?.accessToken,
            address: result?.user?.address,
            neighborhood: result?.user?.neighborhood,
            department: result?.user?.department,
            city: result?.user?.city,
            latitude: result?.user?.latitude,
            longitude: result?.user?.longitude,
          }
        );
      } catch (registerError: any) {
        console.error("❌ [REGISTRO] Error al ejecutar registerUseCase:", {
          error: registerError,
          message: registerError?.message || "Error desconocido",
          code: registerError?.code,
          stack: registerError?.stack,
          credentials: {
            ...credentials,
            phoneNumber: "[oculto]",
            documentNumber: "[oculto]",
          },
        });
        throw registerError;
      }

      try {
        console.log("🚀 [REGISTRO] Redirigiendo al dashboard");
        router.push("/dashboard");
      } catch (routerError: any) {
        console.error("❌ [REGISTRO] Error al redirigir:", {
          error: routerError,
          message: routerError?.message || "Error desconocido",
        });
        // El registro fue exitoso, solo falló la redirección
        // Podríamos mostrar un mensaje de éxito y un botón manual
        setError(
          "Registro exitoso, pero hubo un error al redirigir. Por favor, inicia sesión."
        );
      }
    } catch (err: any) {
      console.error("❌ [REGISTRO] Error completo en registro:", {
        error: err,
        message: err?.message || "Error desconocido",
        code: err?.code,
        stack: err?.stack,
        name: err?.name,
        credentials: {
          firstName,
          lastName,
          phoneNumber: normalizePhoneNumber(phoneNumber),
          documentNumber: documentNumber.replace(/\D/g, ""),
          departmentId,
          cityId,
          leaderId,
          campaignId,
        },
      });
      setError(err instanceof Error ? err.message : "Error al registrarse");
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formatted = formatPhoneNumber(inputValue);
    const normalized = normalizePhoneNumber(inputValue);

    setPhoneNumberDisplay(formatted);
    setPhoneNumber(normalized);
  };

  const handleDocumentNumberChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const inputValue = e.target.value;
    const formatted = formatColombianId(inputValue);
    const normalized = inputValue.replace(/\D/g, "");

    setDocumentNumberDisplay(formatted);
    setDocumentNumber(normalized);
  };

  const selectedDepartment = departments.find(
    (d) => d.id.toString() === departmentId
  );
  const selectedCity = cities.find((c) => c.id.toString() === cityId);

  return (
    <div className="space-y-6">
      {/* Contenedor invisible para reCAPTCHA de Firebase */}
      <div id="recaptcha-container" className="hidden"></div>
      {/* Stepper */}
      <Stepper
        currentStep={currentStep}
        totalSteps={steps.length}
        stepLabels={steps}
      />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded">
        <p className="text-sm font-medium">
          Te estás registrando bajo el Multiplicador{" "}
          <span className="font-bold">{leaderName}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* PASO 1: DATOS PERSONALES */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Paso 1: Datos Personales
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Nombres <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                    placeholder="Juan"
                  />
                </div>
                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Apellidos <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                    placeholder="Pérez"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="documentNumber"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Número de Cédula <span className="text-red-500">*</span>
                </label>
                <input
                  id="documentNumber"
                  type="text"
                  value={documentNumberDisplay}
                  onChange={handleDocumentNumberChange}
                  required
                  maxLength={17}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                  placeholder="123.456.789-0"
                />
                {documentNumber &&
                  !validateColombianId(documentNumber) &&
                  documentNumber.length > 0 && (
                    <p className="mt-1 text-sm text-red-600">
                      Cédula inválida (debe tener entre 7 y 10 dígitos)
                    </p>
                  )}
              </div>

              <div>
                <label
                  htmlFor="phoneNumber"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Teléfono WhatsApp <span className="text-red-500">*</span>
                </label>
                <input
                  id="phoneNumber"
                  type="tel"
                  value={phoneNumberDisplay}
                  onChange={handlePhoneNumberChange}
                  required
                  maxLength={14}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                  placeholder="(123)-456-7890"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Te enviaremos un código de verificación por SMS
                </p>
              </div>

              <button
                type="button"
                onClick={handleNextStep}
                disabled={!validateStep1() || loadingPreResiger}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loadingPreResiger ? (
                  <LoaderWithText text="Procesando..." color="white" />
                ) : (
                  "Continuar"
                )}
              </button>
            </div>
          </div>
        )}

        {/* PASO 2: VERIFICACIÓN DE TELÉFONO */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Paso 2: Verificación de Teléfono
            </h3>

            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded">
                <p className="text-sm">
                  Hemos enviado un código de verificación al número{" "}
                  <span className="font-bold">{phoneNumberDisplay}</span>
                </p>
              </div>

              <div>
                <label
                  htmlFor="otp"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Código OTP (6 dígitos) <span className="text-red-500">*</span>
                </label>
                <input
                  id="otp"
                  type="text"
                  value={otpCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setOtpCode(value);
                  }}
                  required
                  maxLength={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl font-mono tracking-widest text-gray-900 placeholder:text-gray-400"
                  placeholder="000000"
                  autoFocus
                />
                <p className="mt-2 text-sm text-gray-500">
                  Ingresa el código de 6 dígitos que recibiste por SMS
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={handlePreviousStep}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                >
                  ← Volver
                </button>
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={loading || otpCode.length !== 6}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <LoaderWithText text="Verificando..." color="white" />
                  ) : (
                    "Verificar Código"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PASO 3: DATOS TERRITORIALES */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Paso 3: Datos Territoriales
            </h3>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="country"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  País <span className="text-red-500">*</span>
                </label>
                <input
                  id="country"
                  type="text"
                  value={country}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                />
              </div>

              <div>
                <label
                  htmlFor="department"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Departamento / Provincia{" "}
                  <span className="text-red-500">*</span>
                </label>
                <select
                  id="department"
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  required
                  disabled={loadingDepartments}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed bg-white text-gray-900"
                >
                  <option value="">
                    {loadingDepartments
                      ? "Cargando departamentos..."
                      : "Selecciona un departamento"}
                  </option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="city"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Ciudad / Municipio <span className="text-red-500">*</span>
                </label>
                <select
                  id="city"
                  value={cityId}
                  onChange={(e) => setCityId(e.target.value)}
                  required
                  disabled={!departmentId || loadingCities}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed bg-white text-gray-900"
                >
                  <option value="">
                    {!departmentId
                      ? "Primero selecciona un departamento"
                      : loadingCities
                      ? "Cargando ciudades..."
                      : "Selecciona una ciudad"}
                  </option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Dirección <span className="text-red-500">*</span>
                </label>
                {googleMapsApiKey ? (
                  <>
                    <input
                      id="address"
                      ref={addressInputRef}
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                      placeholder="Escribe tu dirección (se autocompletará)"
                      autoComplete="off"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Escribe tu dirección y selecciona una opción del menú
                      desplegable
                    </p>
                  </>
                ) : (
                  <>
                    <input
                      id="address"
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                      placeholder="Escribe tu dirección completa"
                    />
                    <p className="mt-1 text-xs text-yellow-600">
                      ⚠️ Google Maps API no configurada. Ingresa tu dirección
                      manualmente.
                    </p>
                  </>
                )}
              </div>

              <div>
                <label
                  htmlFor="neighborhood"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Barrio / Vereda <span className="text-red-500">*</span>
                </label>
                <input
                  id="neighborhood"
                  type="text"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                  placeholder="Centro, La Candelaria, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ubicación Aproximada
                </label>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                  >
                    📍 Obtener mi ubicación
                  </button>
                  {mapError && (
                    <p className="text-sm text-red-600">{mapError}</p>
                  )}
                  {latitude && longitude && (
                    <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-2 rounded">
                      <p className="text-sm">
                        <strong>Ubicación obtenida:</strong> Lat:{" "}
                        {latitude.toFixed(6)}, Lng: {longitude.toFixed(6)}
                      </p>
                      <p className="text-xs mt-1">
                        Puedes ver tu ubicación en{" "}
                        <a
                          href={`https://www.google.com/maps?q=${latitude},${longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          Google Maps
                        </a>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Consentimientos Legales */}
              <div className="space-y-4 border-t border-gray-200 pt-4">
                <h4 className="text-sm font-semibold text-gray-900">
                  Consentimientos Legales
                </h4>
                <HabeasDataCheckbox
                  value={habeasDataConsent}
                  onChange={(checked) => {
                    setHabeasDataConsent(checked);
                    setHabeasDataError("");
                  }}
                  error={habeasDataError}
                />
                <WhatsAppConsentCheckbox
                  value={whatsAppConsent}
                  onChange={(checked) => {
                    setWhatsAppConsent(checked);
                    setWhatsAppError("");
                  }}
                  error={whatsAppError}
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={handlePreviousStep}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                >
                  ← Volver
                </button>
                <button
                  type="submit"
                  disabled={loading || !validateStep3()}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <LoaderWithText text="Registrando..." color="white" />
                  ) : (
                    "Registrarse"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </form>

      <div className="text-center text-sm text-gray-600">
        ¿Ya tienes una cuenta?{" "}
        <a
          href="/login"
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Iniciar sesión
        </a>
      </div>
    </div>
  );
}
