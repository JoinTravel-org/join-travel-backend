DOCKER_TAG=join-travel-backend
DOCKER_TAG_TEST=$(DOCKER_TAG):test
DOCKERFILE_TEST=Dockerfile.test

docker-image:
	docker build -t $(DOCKER_TAG) .
.PHONY: docker-image

docker-image-test:
	docker build -f $(DOCKERFILE_TEST) -t $(DOCKER_TAG_TEST) .
.PHONY: docker-image-test

docker-run:
	docker run --rm -it -p $(PORT):$(PORT) $(DOCKER_TAG)
.PHONY: docker-run

docker-run-test:
	docker run --rm -it -v $(PWD):/app $(DOCKER_TAG_TEST) /bin/bash
.PHONY: docker-run-test

format:
	gofmt -l -w .
.PHONY: format
