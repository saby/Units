@Library('pipeline') _

def version = '21.2200'

node ('controls') {
    checkout_pipeline("rc-${version}")
    run_branch = load '/home/sbis/jenkins_pipeline/platforma/branch/run_branch'
    run_branch.execute('units', version)
}