Drop the two artefacts exported from the Kaggle notebook here:

    lgbm_delivery_model.pkl    (~1.45 MB)
    feature_columns.pkl        (list of 20 column names)

Export them with:

    import joblib
    joblib.dump(lgbm_final, 'lgbm_delivery_model.pkl')
    joblib.dump(X_trainval.columns.tolist(), 'feature_columns.pkl')

Pin the same lightgbm / scikit-learn versions used for training, otherwise
joblib.load may warn or fail on unpickle.
