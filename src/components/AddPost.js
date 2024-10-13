import { useState, useEffect, useRef } from "react";
import JoditEditor from "jodit-react";
import { createPost as doCreatePost, uploadPostImage } from "../services/post-service";
import { toast } from "react-toastify";
import { auth, db } from './firebase'; 
import { doc, getDoc } from "firebase/firestore"; 

const AddPost = () => {
  const editor = useRef(null);
  const [categories, setCategories] = useState([]);
  const [user, setUser] = useState(undefined);
  const [post, setPost] = useState({
    title: "",
    content: "",
    categoryId: "",
  });
  const [image, setImage] = useState(null);

  useEffect(() => {
    const currentUser = auth.currentUser;
    setUser(currentUser);

    const fetchFollowedTopics = async () => {
      if (currentUser) {
        const userId = currentUser.uid; 
        const userDocRef = doc(db, "users", userId);
        
        try {
          const docSnapshot = await getDoc(userDocRef);
          if (docSnapshot.exists()) {
            const followedTopics = docSnapshot.data().followedTopics || [];
            const followedCategories = followedTopics.map((topic, index) => ({
              categoryId: `followed-${index}`, // Use a dynamic category ID
              categoryTitle: topic,
            }));
            setCategories(followedCategories);
          } else {
            console.log("No followed topics found for the user.");
          }
        } catch (error) {
          console.error("Error fetching followed topics:", error);
          toast.error("Error fetching followed topics.");
        }
      }
    };

    fetchFollowedTopics();
  }, []);

  const fieldChanged = (event) => {
    setPost({ ...post, [event.target.name]: event.target.value });
  };

  const contentFieldChanged = (data) => {
    setPost({ ...post, content: data });
  };

  const createPost = (event) => {
    event.preventDefault();

    if (post.title.trim() === "") {
      toast.error("Post title is required!");
      return;
    }

    if (post.content.trim() === "") {
      toast.error("Post content is required!");
      return;
    }

    if (post.categoryId === "") {
      toast.error("Select a category!");
      return;
    }

    // Attach the user ID to the post object
    post.userId = user.uid; 

    doCreatePost(post)
      .then((data) => {
        if (image) {
          uploadPostImage(image, data.postId)
            .then(() => {
              toast.success("Image Uploaded Successfully!");
            })
            .catch((error) => {
              toast.error("Error uploading image: " + error.message);
              console.log(error);
            });
        }
        toast.success("Post Created Successfully!");
        setPost({
          title: "",
          content: "",
          categoryId: "",
        });
        setImage(null); // Reset the image
      })
      .catch((error) => {
        toast.error("Post not created due to an error: " + error.message);
        console.log(error);
      });
  };

  const handleFileChange = (event) => {
    setImage(event.target.files[0]);
  };

  return (
    <div className="max-w-5xl mx-auto my-8 p-6 bg-white shadow-md rounded-lg">
      <div className="p-5 border-b mb-4">
        <h3 className="text-xl font-bold text-gray-700">What’s going on in your mind?</h3>
      </div>
      <form onSubmit={createPost} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Post Title
          </label>
          <input
            type="text"
            id="title"
            placeholder="Enter your post title here"
            name="title"
            onChange={fieldChanged}
            className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="content" className="block text-sm font-medium text-gray-700">
            Post Content
          </label>
          <JoditEditor
            ref={editor}
            value={post.content}
            onChange={contentFieldChanged}
            className="block w-full border border-gray-300 rounded-lg"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="image" className="block text-sm font-medium text-gray-700">
            Select Post Banner
          </label>
          <input
            id="image"
            type="file"
            onChange={handleFileChange}
            className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">
            Post Category
          </label>
          <select
            id="category"
            name="categoryId"
            onChange={fieldChanged}
            className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
          >
            <option disabled value="">
              -- Select category --
            </option>
            {categories.length > 0 ? (
              categories.map((category) => (
                <option value={category.categoryId} key={category.categoryId}>
                  {category.categoryTitle}
                </option>
              ))
            ) : (
              <option disabled>No categories available</option> 
            )}
          </select>
        </div>

        <div className="text-center">
          <button
            type="submit"
            className="px-6 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg focus:outline-none focus:ring focus:ring-blue-300"
          >
            Create Post
          </button>
          <button
            type="button"
            className="ml-4 px-6 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg focus:outline-none focus:ring focus:ring-red-300"
            onClick={() =>
              setPost({
                title: "",
                content: "",
                categoryId: "",
              })
            }
          >
            Reset Content
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddPost;
