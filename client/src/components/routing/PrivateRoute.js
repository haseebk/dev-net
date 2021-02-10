import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { Route, Redirect } from "react-router-dom";

const PrivateRoute = ({
  component: Component,
  auth: { isAuthenticated, loading },
  ...rest
}) => (
  <Route
    {...rest}
    render={(props) =>
      !isAuthenticated ? <Redirect to="/login" /> : <Component {...props} />
    }
  />
);

// const PrivateRoute = (props) => {
//   if (!props.auth.isAuthenticated && !props.auth.loading) {
//     return <Redirect to="/login" />;
//   } else {
//     return <Route exact path={props.path} component={props.component} />;
//   }
// };

PrivateRoute.propTypes = { auth: PropTypes.object.isRequired };

const mapStateToProps = (state) => ({
  auth: state.auth,
});

export default connect(mapStateToProps)(PrivateRoute);
