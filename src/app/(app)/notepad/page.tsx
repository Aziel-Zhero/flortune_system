"use client";

import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  NotebookPen,
  PlusCircle,
  Edit2,
  Trash2,
  Pin,
  PinOff,
  Eye,
  EyeOff,
} from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Label } from "@/components/ui/label";

interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  isPinned: boolean;
  isPrivate: boolean;
}

const noteColors = [
  { name: "Amarelo", value: "bg-yellow-200/80 dark:bg-yellow-800/40 border-yellow-400 dark:border-yellow-700 text-yellow-900 dark:text-yellow-100" },
  { name: "Azul", value: "bg-blue-200/80 dark:bg-blue-800/40 border-blue-400 dark:border-blue-700 text-blue-900 dark:text-blue-100" },
  { name: "Verde", value: "bg-green-200/80 dark:bg-green-800/40 border-green-400 dark:border-green-700 text-green-900 dark:text-green-100" },
  { name: "Rosa", value: "bg-pink-200/80 dark:bg-pink-800/40 border-pink-400 dark:border-pink-700 text-pink-900 dark:text-pink-100" },
  { name: "Neutro", value: "bg-slate-200/80 dark:bg-slate-800/40 border-slate-400 dark:border-slate-700 text-slate-900 dark:text-slate-100" },
];

const noteSchema = z.object({
  title: z.string().min(1, "O título é obrigatório.").max(100, "Título muito longo."),
  content: z.string().min(1, "O conteúdo é obrigatório."),
  color: z.string().min(1, "Selecione uma cor."),
});

type NoteFormData = z.infer<typeof noteSchema>;

export default function NotepadPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
    document.title = `Anotações - ${APP_NAME}`;
  }, []);

  useEffect(() => {
    try {
      const storedNotes = localStorage.getItem("flortune-notes");
      if (storedNotes) {
        setNotes(JSON.parse(storedNotes));
      }
    } catch (error) {
      toast({
        title: "Erro ao carregar notas",
        description: "Não foi possível carregar suas anotações.",
        variant: "destructive",
      });
    }
    setIsInitialLoad(false);
  }, []);

  useEffect(() => {
    if (isInitialLoad) return;
    localStorage.setItem("flortune-notes", JSON.stringify(notes));
  }, [notes, isInitialLoad]);

  const { control, register, handleSubmit, reset, setValue, formState: { errors } } = useForm<NoteFormData>({
    resolver: zodResolver(noteSchema),
    defaultValues: { title: "", content: "", color: noteColors[0].value },
  });

  const handleAddOrUpdateNote = (data: NoteFormData) => {
    if (editingNote) {
      setNotes(notes.map(n => n.id === editingNote.id ? { ...editingNote, ...data } : n));
      toast({ title: "Nota atualizada", description: `“${data.title}” foi atualizada.` });
    } else {
      const newNote: Note = {
        ...data,
        id: `note_${Date.now()}`,
        isPinned: false,
        isPrivate: false,
      };
      setNotes(prev => [newNote, ...prev]);
      toast({ title: "Nota criada", description: `“${data.title}” foi adicionada.` });
    }
    setEditingNote(null);
    reset({ title: "", content: "", color: noteColors[0].value });
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setValue("title", note.title);
    setValue("content", note.content);
    setValue("color", note.color);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteNote = (id: string) => {
    setNotes(notes.filter(n => n.id !== id));
  };

  const togglePinNote = (id: string) => {
    setNotes(notes.map(n => n.id === id ? { ...n, isPinned: !n.isPinned } : n));
  };

  const togglePrivateNote = (id: string) => {
    setNotes(notes.map(n => n.id === id ? { ...n, isPrivate: !n.isPrivate } : n));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = notes.findIndex(n => n.id === active.id);
      const newIndex = notes.findIndex(n => n.id === over?.id);
      const newNotes = arrayMove(notes, oldIndex, newIndex);
      setNotes(newNotes);
    }
  };

  const sortedNotes = useMemo(() => {
    return [...notes].sort((a, b) => Number(b.isPinned) - Number(a.isPinned));
  }, [notes]);

  return (
    <div>
      <PageHeader
        title="Anotações"
        description="Seu espaço para ideias, lembretes e o que mais precisar anotar."
        icon={<NotebookPen className="h-6 w-6 text-primary" />}
      />

      {/* Formulário */}
      <Card className="mb-6 shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">{editingNote ? "Editar Anotação" : "Nova Anotação"}</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit(handleAddOrUpdateNote)}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_180px] gap-4">
              <div className="space-y-2">
                <Label htmlFor="note-title">Título</Label>
                <Input id="note-title" {...register("title")} />
                {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Cor</Label>
                <Controller
                  name="color"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {noteColors.map((nc) => (
                          <SelectItem key={nc.value} value={nc.value}>
                            <div className="flex items-center gap-2">
                              <span className={cn("h-4 w-4 rounded-full border", nc.value.split(" ")[0])}></span>
                              {nc.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="note-content">Conteúdo</Label>
              <Textarea id="note-content" {...register("content")} rows={4} />
              {errors.content && <p className="text-sm text-destructive">{errors.content.message}</p>}
            </div>
          </CardContent>
          <CardFooter className="gap-2">
            <Button type="submit">
              <PlusCircle className="mr-2 h-4 w-4" />
              {editingNote ? "Salvar Alterações" : "Adicionar Nota"}
            </Button>
            {editingNote && (
              <Button variant="outline" onClick={() => { setEditingNote(null); reset(); }}>
                Cancelar
              </Button>
            )}
          </CardFooter>
        </form>
      </Card>

      {/* Lista de notas */}
      {notes.length === 0 && !isInitialLoad && (
        <div className="text-center py-10 text-muted-foreground">
          <NotebookPen className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <p>Nenhuma anotação ainda. Crie sua primeira!</p>
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sortedNotes.map(n => n.id)} strategy={verticalListSortingStrategy}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <AnimatePresence>
              {sortedNotes.map((note) => (
                <SortableNoteCard key={note.id} note={note}>
                  <Card className={cn("border-2 flex flex-col h-full", note.color, note.isPinned && "ring-2 ring-primary/80")}>
                    <CardHeader className="pb-3 flex-row justify-between items-start">
                      <CardTitle className="text-lg break-words">{note.title}</CardTitle>
                      <button onClick={() => togglePinNote(note.id)} className="hover:text-yellow-500">
                        {note.isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                      </button>
                    </CardHeader>
                    <CardContent className="text-sm flex-grow">
                      {note.isPrivate ? (
                        <div className="italic text-muted-foreground blur-sm select-none">
                          <p>Conteúdo privado.</p>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap break-words">{note.content}</p>
                      )}
                    </CardContent>
                    <CardFooter className="flex justify-end gap-1 pt-3">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => togglePrivateNote(note.id)}>
                        {note.isPrivate ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditNote(note)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteNote(note.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                </SortableNoteCard>
              ))}
            </AnimatePresence>
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SortableNoteCard({ note, children }: { note: Note; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: note.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}
