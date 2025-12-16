"use client";

import { useState, useRef, useEffect } from "react";

// Lista de profesiones comunes en Colombia
const COLOMBIAN_PROFESSIONS = [
  "Abogado",
  "Administrador de Empresas",
  "Agricultor",
  "Ama de Casa",
  "Arquitecto",
  "Asistente Administrativo",
  "Barbero",
  "Cajero",
  "Camarero",
  "Carpintero",
  "Chef",
  "Comerciante",
  "Contador",
  "Conductor",
  "Dentista",
  "Diseñador Gráfico",
  "Docente",
  "Electricista",
  "Empleado de Servicios",
  "Enfermero",
  "Estudiante",
  "Fisioterapeuta",
  "Fotógrafo",
  "Ingeniero Civil",
  "Ingeniero de Sistemas",
  "Ingeniero Industrial",
  "Jardinero",
  "Mecánico",
  "Médico",
  "Mesero",
  "Militar",
  "Nutricionista",
  "Obrero",
  "Panadero",
  "Peluquero",
  "Periodista",
  "Policía",
  "Psicólogo",
  "Publicista",
  "Secretario",
  "Seguridad",
  "Soldador",
  "Técnico",
  "Trabajador Social",
  "Vendedor",
  "Veterinario",
  "Zapatero",
];

interface ProfessionAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  required?: boolean;
  id?: string;
  className?: string;
  placeholder?: string;
}

export function ProfessionAutocomplete({
  value,
  onChange,
  onBlur,
  required = false,
  id = "profession",
  className = "",
  placeholder = "Selecciona o escribe una profesión",
}: ProfessionAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filtrar profesiones basado en el input
  useEffect(() => {
    if (value.trim() === "") {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const filtered = COLOMBIAN_PROFESSIONS.filter((profession) =>
      profession.toLowerCase().includes(value.toLowerCase())
    );

    setSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
    setHighlightedIndex(-1);
  }, [value]);

  // Cerrar sugerencias al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    if (showSuggestions) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSuggestions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleSelectSuggestion = (profession: string) => {
    onChange(profession);
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === "Enter") {
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[highlightedIndex]);
        } else if (suggestions.length === 1) {
          handleSelectSuggestion(suggestions[0]);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        inputRef.current?.blur();
        break;
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        id={id}
        type="text"
        value={value}
        onChange={handleInputChange}
        onBlur={onBlur}
        onFocus={() => {
          if (suggestions.length > 0) {
            setShowSuggestions(true);
          }
        }}
        onKeyDown={handleKeyDown}
        required={required}
        className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400 ${className}`}
        placeholder={placeholder}
        autoComplete="off"
      />
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          {suggestions.map((profession, index) => (
            <button
              key={profession}
              type="button"
              onClick={() => handleSelectSuggestion(profession)}
              className={`w-full text-left px-4 py-2 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none ${
                index === highlightedIndex ? "bg-blue-50" : ""
              }`}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              <span className="text-sm text-gray-900">{profession}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
