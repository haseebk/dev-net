import api from "../utils/api";
import { setAlert } from "./alert";
import { GET_POSTS, POST_ERROR } from "./types";

/**
 * Get posts
 */
export const getPosts = () => async (dispatch) => {
  try {
    const res = await api.get("/posts");

    dispatch({
      type: GET_POSTS,
      payload: res.data,
    });
  } catch (error) {
    dispatch({
      type: POST_ERROR,
      payload: {
        msg: error.response.statusText,
        status: error.responsel.status,
      },
    });
  }
};
