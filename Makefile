DOCKER_TAG=join-travel-backend
DOCKER_TAG_TEST=$(DOCKER_TAG):test
DOCKERFILE_TEST=Dockerfile.test

docker-image:
	docker build -t $(DOCKER_TAG) .
.PHONY: docker-image

docker-run:
	docker run --rm -it -p $(PORT):$(PORT) $(DOCKER_TAG)
.PHONY: docker-run
