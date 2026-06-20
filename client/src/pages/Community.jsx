import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import Loader from "../components/Loader";
import MainLayout from "../layouts/MainLayout";
import {
  addCommunityComment,
  createCommunityPost,
  fetchCommunityPosts,
  likeCommunityPost,
} from "../services/communityApi";

const fallbackPosts = [
  {
    _id: "fallback-1",
    authorName: "Ravi Kumar",
    question: "How many days after transplanting should I apply urea for paddy?",
    likes: 12,
    comments: [{ text: "Split application works better. Check field water before applying." }],
  },
  {
    _id: "fallback-2",
    authorName: "Anitha Reddy",
    question: "My tomato leaves are curling after recent rain. What should I check first?",
    likes: 8,
    comments: [{ text: "Inspect for whiteflies and remove heavily affected leaves." }],
  },
];

const Community = () => {
  const [posts, setPosts] = useState(fallbackPosts);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);

  const loadPosts = () => {
    setLoading(true);
    fetchCommunityPosts()
      .then(({ data }) => {
        if (data.posts.length) {
          setPosts(data.posts);
        }
      })
      .catch(() => toast.error("Showing offline community posts"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const addPost = async (event) => {
    event.preventDefault();
    if (!question.trim()) return;
    try {
      const { data } = await createCommunityPost({ question: question.trim() });
      setPosts((current) => [data.post, ...current]);
      setQuestion("");
      toast.success("Discussion posted");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to post discussion");
    }
  };

  const addComment = async (postId, comment) => {
    if (!comment.trim()) return;
    try {
      const { data } = await addCommunityComment(postId, { text: comment.trim() });
      setPosts((current) => current.map((post) => (post._id === postId ? data.post : post)));
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to add comment");
    }
  };

  const likePost = async (postId) => {
    try {
      const { data } = await likeCommunityPost(postId);
      setPosts((current) => current.map((post) => (post._id === postId ? data.post : post)));
    } catch (error) {
      toast.error("Unable to like post");
    }
  };

  return (
    <MainLayout
      eyebrow="Farmer Network"
      title="Community"
      subtitle="Post farming questions, share experiences, and discuss field problems."
    >
      <form className="ag-form ag-toolbar" onSubmit={addPost}>
        <input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Post a farming question" />
        <button type="submit">Post</button>
      </form>
      {loading && <Loader label="Loading discussions" />}
      <div className="ag-stack">
        {posts.map((post) => (
          <CommunityPost key={post._id} post={post} onComment={addComment} onLike={likePost} />
        ))}
      </div>
    </MainLayout>
  );
};

const CommunityPost = ({ post, onComment, onLike }) => {
  const [comment, setComment] = useState("");

  const submitComment = (event) => {
    event.preventDefault();
    onComment(post._id, comment);
    setComment("");
  };

  return (
    <article className="ag-panel">
      <p className="ag-eyebrow">{post.authorName || "Farmer"}</p>
      <h2>{post.question}</h2>
      <button className="ag-inline-action" type="button" onClick={() => onLike(post._id)}>
        Like ({post.likes})
      </button>
      <div className="ag-alert-list">
        {post.comments.map((item, index) => (
          <article className="ag-alert" key={`${post._id}-${index}`}>{item.text}</article>
        ))}
      </div>
      <form className="ag-form ag-toolbar" onSubmit={submitComment}>
        <input value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Write a comment" />
        <button type="submit">Comment</button>
      </form>
    </article>
  );
};

export default Community;
