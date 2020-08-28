@Library('pipeline') _

def version = '20.6000'

node ('controls') {
    checkout_pipeline("20.6000/bugfix/units_params")
    run_branch = load '/home/sbis/jenkins_pipeline/platforma/branch/run_branch'
    run_branch.execute('units', version)
}