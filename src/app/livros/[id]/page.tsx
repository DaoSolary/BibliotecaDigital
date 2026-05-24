import { notFound } from "next/navigation";

import { Separator } from "@/components/ui/separator";

import { BookDetail } from "@/components/books/book-detail";

import { RatingForm } from "@/components/books/rating-form";

import { CommentsSection } from "@/components/books/comments-section";

import { createClient } from "@/lib/supabase/server";

import { getBookById } from "@/lib/actions/books";

import { comTimeout } from "@/lib/supabase/query";



interface PageProps {

  params: Promise<{ id: string }>;

}



export const revalidate = 30;



export async function generateMetadata({ params }: PageProps) {

  try {

    const { id } = await params;

    const book = await getBookById(id);

    return { title: book.title };

  } catch {

    return { title: "Livro" };

  }

}



export default async function BookPage({ params }: PageProps) {

  const { id } = await params;



  let book;

  try {

    book = await getBookById(id);

  } catch {

    notFound();

  }



  const supabase = await createClient();

  const { data: commentsData } = await comTimeout(

    supabase

      .from("comments")

      .select("*, profile:profiles(id, full_name, avatar_url)")

      .eq("book_id", id)

      .eq("is_approved", true)

      .order("created_at", { ascending: false }),

    6000

  );



  return (

    <div className="container mx-auto px-4 py-8 space-y-10">

      <BookDetail book={book} />



      <Separator />



      <div className="space-y-3">

        <h3 className="text-lg font-semibold">Avaliar este livro</h3>

        <RatingForm bookId={id} />

      </div>



      <Separator />



      <CommentsSection bookId={id} comments={commentsData?.data ?? []} />

    </div>

  );

}

