pipeline {
    agent any

    environment {
        COMPOSE_PROJECT_NAME = 'medibook'
        HOST_PORT = '8080'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Validate') {
            steps {
                script {
                    def required = [
                        'backend/src/server.js',
                        'frontend/src/App.jsx',
                        'docker-compose.yml',
                        'nginx/nginx.conf',
                        'Jenkinsfile'
                    ]
                    required.each { path ->
                        if (!fileExists(path)) {
                            error "Missing required file: ${path}"
                        }
                    }
                }
            }
        }

        stage('Build') {
            steps {
                sh 'docker compose build --no-cache'
            }
        }

        stage('Deploy') {
            steps {
                sh 'docker compose down || true'
                sh 'docker compose up -d'
                sh 'sleep 15'
                sh 'docker compose exec -T api node src/scripts/seed.js || true'
            }
        }

        stage('Health Check') {
            steps {
                sh 'curl -f http://localhost:${HOST_PORT}/api/health || exit 1'
            }
        }
    }

    post {
        success {
            echo "MediBook deployed at http://localhost:${HOST_PORT}"
        }
        failure {
            echo 'Pipeline failed. Check Jenkins console output.'
        }
        always {
            sh 'docker image prune -f 2>/dev/null || true'
        }
    }
}
