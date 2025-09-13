import os
from typing import Optional

import boto3
from botocore.exceptions import ClientError


def is_configured() -> bool:
    return bool(
        os.getenv("AWS_ACCESS_KEY_ID")
        and os.getenv("AWS_SECRET_ACCESS_KEY")
        and os.getenv("AWS_REGION")
        and os.getenv("S3_BUCKET_NAME")
    )


def _client():
    region = os.getenv("AWS_REGION")
    return boto3.client(
        "s3",
        region_name=region,
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    )


def bucket() -> Optional[str]:
    return os.getenv("S3_BUCKET_NAME")


def object_exists(key: str, bucket_name: Optional[str] = None) -> bool:
    bkt = bucket_name or bucket()
    if not bkt:
        return False
    try:
        _client().head_object(Bucket=bkt, Key=key)
        return True
    except ClientError as e:
        if e.response.get("ResponseMetadata", {}).get("HTTPStatusCode") == 404:
            return False
        return False


def upload_bytes(
    key: str,
    data: bytes,
    content_type: str = "application/octet-stream",
    public: bool = True,
    bucket_name: Optional[str] = None,
) -> Optional[str]:
    bkt = bucket_name or bucket()
    if not bkt:
        return None
    extra = {"ContentType": content_type}
    if public:
        extra["ACL"] = "public-read"
    _client().put_object(Bucket=bkt, Key=key, Body=data, **extra)
    return public_url(key, bkt)


def upload_file(key: str, filepath: str, content_type: Optional[str] = None, public: bool = True) -> Optional[str]:
    bkt = bucket()
    if not bkt:
        return None
    extra = {}
    if content_type:
        extra["ContentType"] = content_type
    if public:
        extra["ACL"] = "public-read"
    _client().upload_file(filepath, bkt, key, ExtraArgs=extra if extra else None)
    return public_url(key, bkt)


def download_file(key: str, filepath: str, bucket_name: Optional[str] = None) -> bool:
    bkt = bucket_name or bucket()
    if not bkt:
        return False
    try:
        os.makedirs(os.path.dirname(filepath) or ".", exist_ok=True)
        _client().download_file(bkt, key, filepath)
        return True
    except ClientError:
        return False


def public_url(key: str, bucket_name: Optional[str] = None) -> Optional[str]:
    bkt = bucket_name or bucket()
    region = os.getenv("AWS_REGION", "us-east-1")
    if not bkt:
        return None
    # Virtual-hosted–style URL
    if region == "us-east-1":
        return f"https://{bkt}.s3.amazonaws.com/{key}"
    return f"https://{bkt}.s3.{region}.amazonaws.com/{key}"

