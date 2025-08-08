import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const categoriasFarmacia = [
  "Analgésicos",
  "Antibióticos",
  "Antiinflamatorios",
  "Antihistamínicos",
  "Antiácidos",
  "Vitaminas",
  "Antipiréticos",
  "Antisépticos",
  "Anticonceptivos",
  "Antimicóticos",
  "Antiparasitarios",
  "Antivirales",
  "Broncodilatadores",
  "Descongestionantes",
  "Expectorantes",
  "Laxantes",
  "Antidiarreicos",
  "Antieméticos",
  "Antitusivos",
  "Corticoides",
  "Cardiotónicos",
  "Hipoglucemiantes",
  "Insulinas",
  "Suplementos Minerales",
  "Colirios",
  "Soluciones Oftálmicas",
  "Cremas y Pomadas",
  "Jarabes",
  "Inyectables",
  "Productos Naturistas",
  "Productos para Bebés",
  "Productos para Adultos Mayores",
  "Material Médico",
  "Curitas y Vendas",
  "Otros"
];

interface ComboBoxCategoriaProps {
  value?: string;
  onChange: (value: string) => void;
}

export function ComboBoxCategoria({ value, onChange }: ComboBoxCategoriaProps) {
  const [input, setInput] = useState(value || "");
  const [categorias, setCategorias] = useState<string[]>(categoriasFarmacia);

  // Filtra categorías según lo que escribe
  const categoriasFiltradas = categorias.filter(cat =>
    cat.toLowerCase().includes(input.toLowerCase())
  );

  // Añadir nueva categoría si no existe
  const handleAddCategoria = () => {
    if (input && !categorias.includes(input)) {
      setCategorias([input, ...categorias]);
      onChange(input);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="categoria">Categoría</Label>
      <div className="relative">
        <Input
          id="categoria"
          placeholder="Escribe o selecciona una categoría"
          value={input}
          onChange={e => {
            setInput(e.target.value);
            onChange(e.target.value);
          }}
          className="pr-24"
          list="categorias-list"
          autoComplete="off"
        />
        <datalist id="categorias-list">
          {categoriasFiltradas.map(cat => (
            <option key={cat} value={cat} />
          ))}
        </datalist>
        {input && !categorias.includes(input) && (
          <Button
            type="button"
            className="absolute right-1 top-1/2 -translate-y-1/2 text-xs"
            onClick={handleAddCategoria}
            variant="outline"
          >
            Añadir "{input}"
          </Button>
        )}
      </div>
    </div>
  );
}