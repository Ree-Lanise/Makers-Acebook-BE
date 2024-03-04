const Post = require("../models/post");
const { generateToken } = require("../lib/token");

const getAllPosts = async (req, res) => {
  //Get all posts and populate the createdBy field with user data
  const posts = await Post.find().populate("createdBy");
  const posts2 = await Post.find();

  const updatedPosts = [];

  /* creating an updatedPosts object with the relevant data for both the post and the user - 
  excluding any sensitive data, i.e password for instance. */
  posts.forEach((post) => {
    let newPost = {
      _id: post._id,
      message: post.message,
      createdAt: post.createdAt,
      createdBy: { _id: post.createdBy._id, username: post.createdBy.username },
    };

    updatedPosts.push(newPost);
  });

  const token = generateToken(req.user_id);
  res.status(200).json({ posts: updatedPosts, token: token });
};

const createPost = async (req, res) => {
  const postContent = {
    message: req.body.message,
    createdAt: Date.now(),
    createdBy: req.user_id,
  };

  const post = new Post(postContent);
  post.save();

  const newToken = generateToken(req.user_id);
  res.status(201).json({ message: "OK", token: newToken });
};

const updateLikes = async (req, res) => {
  const userId = req.user_id;
  const postId = req.body.postId;

  /*Find the post the user wants to like*/
  const post = await Post.find({ _id: postId });

  let alreadyLiked = false;

  /*Figure out whether the post has already been liked*/
  post[0].likes.forEach((likeId) => {
    if (likeId.toString() === userId) {
      alreadyLiked = true;
    }
  });

  /*If the post is already liked, delete the userId from the likes array*/
  if (alreadyLiked) {
    post[0].likes = post[0].likes.filter((likeId) => { 
      return likeId.toString() != userId;
    })

    await Post.findOneAndUpdate({ _id: postId }, post[0]);
    const updatedPost = await Post.find({ _id: postId });

    const token = generateToken(userId);
    res.status(201).json({
      post: updatedPost,
      token: token,
      message: "Succesfully unliked post",
    });
  } else { /*If the post hasn't yet been liked, add the userId to the array*/
    post[0].likes.push(userId);
    
    await Post.findOneAndUpdate({ _id: postId }, post[0]);
    const updatedPost = await Post.find({ _id: postId });

    const token = generateToken(userId);
    res
      .status(201)
      .json({
        post: updatedPost,
        token: token,
        message: "Succesfully liked post",
      });
  }
};

const PostsController = {
  getAllPosts: getAllPosts,
  createPost: createPost,
  updateLikes: updateLikes,
};

module.exports = PostsController;
