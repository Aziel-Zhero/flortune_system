
// src/app/(app)/notepad/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NotebookPen, PlusCircle, Edit2, Trash2, Pin, PinOff, Eye, EyeOff } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence, useDragControls } from "framer-motion";

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
  const dragControls = useDragControls();

  useEffect(() => {
    document.title = `Anotações - ${APP_NAME}`;
  }, []);

  const { control, register, handleSubmit, reset, setValue, formState: { errors } } = useForm<NoteFormData>({
    resolver: zodResolver(noteSchema),
    defaultValues: { title: "", content: "", color: noteColors[0].value },
  });

  const handleAddOrUpdateNote = (data: NoteFormData) => {
    if (editingNote) {
      setNotes(notes.map(n => n.id === editingNote.id ? { ...editingNote, ...data } : n));
      toast({ title: "Nota Atualizada!", description: `"${data.title}" foi atualizada.`});
    } else {
      const newNote: Note = { ...data, id: `note_${Date.now()}`, isPinned: false, isPrivate: false };
      setNotes(prev => [newNote, ...prev]);
      toast({ title: "Nota Criada!", description: `"${data.title}" foi adicionada.`});
    }
    setEditingNote(null);
    reset({ title: "", content: "", color: noteColors[0].value });
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setValue("title", note.title);
    setValue("content", note.content);
    setValue("color", note.color);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteNote = (noteId: string) => {
    setNotes(notes.filter(n => n.id !== noteId));
    toast({ title: "Nota Deletada!", variant: "destructive"});
  };
  
  const togglePinNote = (noteId: string) => {
    setNotes(notes.map(n => n.id === noteId ? { ...n, isPinned: !n.isPinned } : n));
  };

  const togglePrivateNote = (noteId: string) => {
     setNotes(notes.map(n => n.id === noteId ? { ...n, isPrivate: !n.isPrivate } : n));
  };
  
  const sortedNotes = useMemo(() => {
    return [...notes].sort((a, b) => Number(b.isPinned) - Number(a.isPinned));
  }, [notes]);

  return (
    <div className="bg-[radial-gradient(hsl(var(--muted))_1px,transparent_1px)] [background-size:16px_16px] -m-8 p-8 min-h-[calc(100vh_-_4rem)]">
      <PageHeader
        title="Anotações"
        description="Seu espaço para ideias, lembretes e o que mais precisar anotar."
        icon={<NotebookPen className="h-6 w-6 text-primary" />}
      />
      <Card className="mb-6 shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">{editingNote ? "Editar Anotação" : "Nova Anotação"}</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit(handleAddOrUpdateNote)}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_180px] gap-4">
                <div className="space-y-2">
                    <Label htmlFor="note-title">Título</Label>
                    <Input id="note-title" {...register("title")} placeholder="Título da sua anotação" />
                    {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="note-color">Cor da Nota</Label>
                    <Controller
                        name="color"
                        control={control}
                        render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger id="note-color"><SelectValue placeholder="Cor" /></SelectTrigger>
                            <SelectContent>
                            {noteColors.map(nc => (
                                <SelectItem key={nc.value} value={nc.value}>
                                <div className="flex items-center gap-2">
                                    <span className={cn("h-4 w-4 rounded-full inline-block border", nc.value.split(' ')[0])}></span>
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
            <div className="space-y-2">
              <Label htmlFor="note-content">Conteúdo</Label>
              <Textarea id="note-content" {...register("content")} placeholder="Escreva sua anotação aqui..." rows={4} />
              {errors.content && <p className="text-sm text-destructive mt-1">{errors.content.message}</p>}
            </div>
          </CardContent>
          <CardFooter className="gap-2">
            <Button type="submit">
              <PlusCircle className="mr-2 h-4 w-4" /> {editingNote ? "Salvar Alterações" : "Adicionar Nota"}
            </Button>
            {editingNote && (
              <Button type="button" variant="outline" onClick={() => { setEditingNote(null); reset({ title: "", content: "", color: noteColors[0].value }); }}>
                Cancelar Edição
              </Button>
            )}
          </CardFooter>
        </form>
      </Card>

      {notes.length === 0 && (
        <div className="text-center py-10 text-muted-foreground">
          <NotebookPen className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <p>Nenhuma anotação ainda. Crie sua primeira!</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <AnimatePresence>
            {sortedNotes.map(note => (
            <motion.div
                key={note.id}
                layout
                drag
                dragControls={dragControls}
                dragConstraints={{ top: -20, left: -20, right: 20, bottom: 20 }}
                initial={{ opacity: 0, scale: 0.8, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                className="cursor-grab active:cursor-grabbing"
            >
                <Card className={cn("shadow-md hover:shadow-lg transition-shadow border-2 h-full flex flex-col", note.color, note.isPinned && "ring-2 ring-primary/80")}>
                    <CardHeader onPointerDown={(e) => dragControls.start(e)} className="pb-3 flex-row items-start justify-between cursor-grab active:cursor-grabbing">
                        <CardTitle className="font-headline text-lg break-words">{note.title}</CardTitle>
                        <button onClick={() => togglePinNote(note.id)} className="text-muted-foreground hover:text-yellow-500 transition-colors z-10">
                            {note.isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                        </button>
                    </CardHeader>
                    <CardContent className="text-sm break-words flex-grow">
                    {note.isPrivate ? (
                        <div className="italic text-muted-foreground blur-sm select-none">
                            <p>Conteúdo privado.</p>
                            <p>Clique no ícone para revelar.</p>
                        </div>
                    ) : (
                        <p className="whitespace-pre-wrap">{note.content}</p>
                    )}
                    </CardContent>
                    <CardFooter className="flex justify-end gap-1 pt-3">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => togglePrivateNote(note.id)}>
                        {note.isPrivate ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-blue-500" onClick={() => handleEditNote(note)}>
                        <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteNote(note.id)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                    </CardFooter>
                </Card>
            </motion.div>
            ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
