import { supabase } from "../config/supabase.js";

export const getPosts = async (req, res, next) => {
  try {
    const { data: posts, error } = await supabase
      .from("community_posts")
      .select(`
        *,
        comments:community_comments(
          id,
          post_id,
          author_id,
          author_name,
          text,
          created_at
        )
      `)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    const formattedPosts = (posts || []).map(post => ({
      _id: post.id,
      id: post.id,
      author: post.author_id,
      authorName: post.author_name,
      question: post.question,
      likes: post.likes,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
      comments: (post.comments || []).map(comment => ({
        _id: comment.id,
        id: comment.id,
        author: comment.author_id,
        authorName: comment.author_name,
        text: comment.text,
        createdAt: comment.created_at
      }))
    }));

    res.status(200).json({ success: true, posts: formattedPosts });
  } catch (error) {
    next(error);
  }
};

export const createPost = async (req, res, next) => {
  try {
    const { data: post, error } = await supabase
      .from("community_posts")
      .insert({
        author_id: req.user?.id,
        author_name: req.user?.name || req.body.authorName || "Farmer",
        question: req.body.question,
      })
      .select()
      .single();

    if (error) throw error;

    const formattedPost = {
      _id: post.id,
      id: post.id,
      author: post.author_id,
      authorName: post.author_name,
      question: post.question,
      likes: post.likes,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
      comments: []
    };

    res.status(201).json({ success: true, post: formattedPost });
  } catch (error) {
    next(error);
  }
};

export const likePost = async (req, res, next) => {
  try {
    const { data: currentPost, error: selectError } = await supabase
      .from("community_posts")
      .select("likes")
      .eq("id", req.params.postId)
      .maybeSingle();

    if (selectError) throw selectError;
    if (!currentPost) {
      const error = new Error("Post not found");
      error.statusCode = 404;
      throw error;
    }

    const { data: post, error: updateError } = await supabase
      .from("community_posts")
      .update({ likes: (currentPost.likes || 0) + 1 })
      .eq("id", req.params.postId)
      .select()
      .single();

    if (updateError) throw updateError;

    const { data: comments, error: commentsError } = await supabase
      .from("community_comments")
      .select("*")
      .eq("post_id", req.params.postId);

    if (commentsError) throw commentsError;

    const formattedPost = {
      _id: post.id,
      id: post.id,
      author: post.author_id,
      authorName: post.author_name,
      question: post.question,
      likes: post.likes,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
      comments: (comments || []).map(comment => ({
        _id: comment.id,
        id: comment.id,
        author: comment.author_id,
        authorName: comment.author_name,
        text: comment.text,
        createdAt: comment.created_at
      }))
    };

    res.status(200).json({ success: true, post: formattedPost });
  } catch (error) {
    next(error);
  }
};

export const addComment = async (req, res, next) => {
  try {
    const { text } = req.body;
    const { postId } = req.params;

    const { data: postExists, error: postExistsError } = await supabase
      .from("community_posts")
      .select("id")
      .eq("id", postId)
      .maybeSingle();

    if (postExistsError) throw postExistsError;
    if (!postExists) {
      const error = new Error("Post not found");
      error.statusCode = 404;
      throw error;
    }

    const { error: insertError } = await supabase
      .from("community_comments")
      .insert({
        post_id: postId,
        author_id: req.user?.id,
        author_name: req.user?.name || req.body.authorName || "Farmer",
        text,
      });

    if (insertError) throw insertError;

    const { data: post, error: postError } = await supabase
      .from("community_posts")
      .select(`
        *,
        comments:community_comments(
          id,
          post_id,
          author_id,
          author_name,
          text,
          created_at
        )
      `)
      .eq("id", postId)
      .single();

    if (postError) throw postError;

    const formattedPost = {
      _id: post.id,
      id: post.id,
      author: post.author_id,
      authorName: post.author_name,
      question: post.question,
      likes: post.likes,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
      comments: (post.comments || []).map(c => ({
        _id: c.id,
        id: c.id,
        author: c.author_id,
        authorName: c.author_name,
        text: c.text,
        createdAt: c.created_at
      }))
    };

    res.status(200).json({ success: true, post: formattedPost });
  } catch (error) {
    next(error);
  }
};
