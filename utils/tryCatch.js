const tryCatch = async fn => {
  let err;
  let res;
  try {
    res = await fn();
  } catch (error) {
    err = error;
  }

  return [err, res];
};

export default tryCatch;
