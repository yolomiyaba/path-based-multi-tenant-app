aws_region  = "ap-northeast-1"
environment = "dev"

vpc_id   = "vpc-0dca8dbd4d4d2a5dc"
vpc_cidr = "10.0.0.0/16"

private_subnet_ids = [
  "subnet-0d3268e695030419e",  # lead-agent-private-1a
  "subnet-0f94aa029953a31a0",  # lead-agent-private-1c
]
