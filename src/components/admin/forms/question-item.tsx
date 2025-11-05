// src/components/admin/forms/question-item.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Edit, Trash2, GripVertical, Star, Type, MessageSquare, ToggleRight } from "lucide-react";

export interface FormQuestion {
  id: string;
  text: string;
  type: 'text' | 'textarea' | 'rating' | 'boolean';
  category: 'Geral' | 'Usabilidade' | 'Design' | 'Funcionalidades' | 'Recursos';
}

interface QuestionItemProps {
  question: FormQuestion;
  onEdit: () => void;
  onDelete: () => void;
}

const typeConfig = {
    text: { icon: Type, label: "Texto Curto" },
    textarea: { icon: MessageSquare, label: "Texto Longo" },
    rating: { icon: Star, label: "Avaliação (1-5)" },
    boolean: { icon: ToggleRight, label: "Sim/Não" },
};

const categoryColors: Record<FormQuestion['category'], string> = {
    Geral: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
    Usabilidade: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
    Design: "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300",
    Funcionalidades: "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300",
    Recursos: "bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-300",
};


export function QuestionItem({ question, onEdit, onDelete }: QuestionItemProps) {
    const TypeIcon = typeConfig[question.type].icon;
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({id: question.id});
    
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

  return (
    <div 
        ref={setNodeRef}
        style={style}
        className="flex items-center gap-3 p-3 border rounded-md bg-card hover:bg-muted/50 transition-colors"
    >
      <button {...attributes} {...listeners} className="cursor-grab p-1">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </button>
      <div className="flex-grow">
        <p className="font-medium text-sm">{question.text}</p>
        <div className="flex items-center gap-2 mt-1.5">
            <Badge variant="secondary" className="flex items-center gap-1">
                <TypeIcon className="h-3 w-3" />
                {typeConfig[question.type].label}
            </Badge>
             <Badge variant="outline" className={categoryColors[question.category]}>
                {question.category}
            </Badge>
        </div>
      </div>
      <div className="flex gap-1">
        <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={onEdit}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
